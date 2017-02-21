'use strict'

const tags = ['api', 'root']

module.exports = [
  {
    method: 'GET',
    path: '/health',
    handler: (request, reply) => reply({ status: 'OK' }).code(200),
    config: {
      tags: tags,
      description: 'Status of ledger',
      id: 'health'
    }
  }
]
