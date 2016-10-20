'use strict'

const Config = require('./lib/config')
const Pack = require('../package')

function stripEmpty (list) {
  return list.filter(n => n)
}

module.exports = {
  connections: [{ port: Config.PORT }],
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
            console: [
              {
                module: 'good-squeeze',
                name: 'Squeeze',
                args: [
                  {
                    response: '*',
                    log: '*',
                    error: '*'
                  }
                ]
              },
              {
                module: 'good-console',
                args: [
                  {
                    format: 'YYYY-MM-DD HH:mm:ss.SSS'
                  }
                ]
              },
              'stdout'
            ]
          }
        }
      }
    }
  ])
}
