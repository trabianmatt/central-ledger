'use strict'

const Hapi = require('hapi')
const Inert = require('inert')
const Vision = require('vision')
const HapiSwagger = require('hapi-swagger')
const Massive = require('massive')
const Pack = require('../package')

let server = new Hapi.Server()
server.connection({ port: 3000 })

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

    server.app.db = Massive.connectSync({ connectionString: 'postgres://central_ledger:cVq8iFqaLuHy8jjKuA@localhost:5432/central_ledger' })

    server.log('info', 'Server running at: ' + server.info.uri)
  })
})

module.exports = server
