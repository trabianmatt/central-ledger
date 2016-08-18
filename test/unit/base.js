'use strict'

const Hapi = require('hapi')
const Sinon = require('sinon')

function setup () {
  const fixtures = {}

  const server = new Hapi.Server()
  server.connection({port: 8000})

  server.register({
    register: require('../../src/modules/subscriptions')
  })

  let mockDb = Sinon.mock({})
  server.app.db = mockDb

  fixtures.server = server

  return fixtures
}

function buildRequest (url, method, payload) {
  return { url: url, method: method, payload: payload }
}

function assertServerError (assert, response) {
  assert.equal(response.statusCode, 500)
  assert.equal(response.result.error, 'Internal Server Error')
  assert.equal(response.result.message, 'An internal server error occurred')
}

function assertNotFoundError (assert, response) {
  assert.equal(response.statusCode, 404)
  assert.equal(response.result.error, 'Not Found')
}

module.exports = {
  setup,
  buildRequest,
  assertServerError,
  assertNotFoundError
}
