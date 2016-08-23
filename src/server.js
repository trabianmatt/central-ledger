'use strict'

const Hapi = require('hapi')
const Inert = require('inert')
const Vision = require('vision')
const HapiSwagger = require('hapi-swagger')
const Massive = require('massive')
const Pack = require('../package')
const Config = require('./lib/config')

let server = new Hapi.Server()
server.connection({ port: Config.PORT })

let plugins = [
  Inert,
  Vision,
  {
    register: HapiSwagger,
    options: {
      info: {
        'title': 'Central Ledger API Documentation',
        'version': Pack.version
      }
    }
  },
  {
    register: require('blipp')
  },
  {
    register: require('good'),
    options: {
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
  },
  {
    register: require('./modules/subscriptions')
  }
]

server.register(plugins, function (err) {
  if (err) {
    server.log(['error', 'plugins'], err)
    throw err
  }

  server.start((err) => {
    if (err) {
      server.log(['error', 'server'], err)
      throw err
    }

    server.app.db = Massive.connectSync({ connectionString: Config.DATABASE_URI })

    server.log('info', 'Server running at: ' + server.info.uri)
  })
})

module.exports = server
