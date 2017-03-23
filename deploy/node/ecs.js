'use strict'

const AWS = require('aws-sdk')
const ecs = new AWS.ECS()

const registerTaskDefinition = (name, image, port, environment = []) => {
  const params = {
    containerDefinitions: [
      {
        name,
        image,
        essential: true,
        memoryReservation: 200,
        portMappings: [
          {
            containerPort: port
          }
        ],
        environment,
        logConfiguration: {
          logDriver: 'syslog',
          options: {
            'syslog-address': 'tcp://127.0.0.1:514',
            'syslog-facility': 'daemon',
            'tag': 'central-ledger'
          }
        }
      }
    ],
    family: name
  }

  return ecs.registerTaskDefinition(params).promise()
    .then(result => {
      const revision = result.taskDefinition.taskDefinitionArn
      console.log(`Registered task definition: ${revision}`)
      return revision
    })
}

const deployService = (clusterName, service, taskDefinition) => {
  const params = {
    service,
    taskDefinition,
    cluster: clusterName,
    desiredCount: 1
  }

  console.log(`Deploying ${taskDefinition} to ${service} on cluster ${clusterName}`)

  return ecs.updateService(params).promise()
    .then(result => result.service.taskDefinition)
}

module.exports = {
  registerTaskDefinition,
  deployService
}
