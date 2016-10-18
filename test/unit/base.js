'use strict'

const Hapi = require('hapi')

function setup () {
  const fixtures = {}

  const server = new Hapi.Server()
  server.connection({port: 8000})

  server.register({
    register: require('../../src/api')
  })

  fixtures.server = server

  return fixtures
}

function buildRequest (options) {
  return { url: options.url, method: options.method || 'GET', payload: options.payload || '', headers: options.headers || {} }
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

function assertBadRequestError (assert, response, validationErrors) {
  assert.equal(response.result.id, 'InvalidBodyError')
  assert.equal(response.result.message, 'The submitted JSON entity does not match the required schema.')
  assert.deepEqual(response.result.validationErrors, validationErrors)
}

module.exports = {
  setup,
  buildRequest,
  assertServerError,
  assertNotFoundError,
  assertBadRequestError
}
