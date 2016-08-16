'use strict'

const Hapi = require('hapi')

function setup () {
  const fixtures = {}

  const server = new Hapi.Server()
  server.connection({port: 8000})

  server.register({
    register: require('../../src/modules/subscriptions')
  })

  fixtures.server = server

  return fixtures
}

function buildRequest (url, method) {
  return { url: url, method: method }
}

module.exports = {
  setup,
  buildRequest
}
