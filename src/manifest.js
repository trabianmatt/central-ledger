'use strict'

const Pack = require('../package')
const Config = require('./lib/config')
const Logger = require('@leveloneproject/central-services-shared').Logger

function stripEmpty (list) {
  return list.filter(n => n)
}

module.exports = {
  connections: [{
    port: Config.PORT,
    routes: {
      validate: require('@leveloneproject/central-services-error-handling').validateRoutes()
    }
  }],
  registrations: stripEmpty([
    { plugin: 'inert' },
    { plugin: 'vision' },
    {
      plugin: {
        register: 'hapi-swagger',
        options: {
          info: {
            'title': 'Central Ledger API Documentation',
            'version': Pack.version
          }
        }
      }
    },
    { plugin: 'blipp' },
    { plugin: '@leveloneproject/central-services-error-handling' },
    { plugin: './api' },
    { plugin: './webhooks' },
    (Config.EXPIRES_TIMEOUT) ? { plugin: './worker' } : null,
    { plugin: './sockets' },
    {
      plugin: {
        register: 'good',
        options: {
          ops: {
            interval: 1000
          },
          reporters: {
            winston: [{
              module: 'good-winston',
              args: [
                Logger._logger,
                {
                  error_level: 'error',
                  ops_level: 'debug',
                  request_level: 'debug',
                  response_level: 'info',
                  other_level: 'info'
                }
              ]
            }]
          }
        }
      }
    }
  ])
}
