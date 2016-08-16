'use strict'

const Hapi = require('hapi')

const server = new Hapi.Server()
server.connection({ port: 3000 })

const plugins = [
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
    server.log('info', 'Server running at: ' + server.info.uri)
  })
})

module.exports = server
