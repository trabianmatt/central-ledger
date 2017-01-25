'use strict'

const Pack = require('../package')
const Config = require('./lib/config')
const Logger = require('@leveloneproject/central-services-shared').Logger
const ApiTag = 'api'
const AdminTag = 'admin'

function stripEmpty (list) {
  return list.filter(n => n)
}

module.exports = {
  connections: [
    {
      port: Config.PORT,
      labels: ApiTag,
      routes: {
        validate: require('@leveloneproject/central-services-error-handling').validateRoutes()
      }
    },
    {
      port: Config.ADMIN_PORT,
      labels: AdminTag
    }
  ],
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
    { plugin: '@leveloneproject/central-services-auth' },
    {
      plugin: './api/auth',
      options: {
        select: [ApiTag]
      }
    },
    {
      plugin: './api',
      options: {
        select: [ApiTag]
      }
    },
    (Config.EXPIRES_TIMEOUT) ? { plugin: './worker', options: { select: [ApiTag] } } : null,
    {
      plugin: './sockets',
      options: {
        select: [ApiTag]
      }
    },
    {
      plugin: './admin/auth',
      options: {
        select: [AdminTag]
      }
    },
    {
      plugin: './admin',
      options: {
        select: [AdminTag]
      }
    },
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
