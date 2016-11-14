'use strict'

const Hapi = require('hapi')
const ErrorHandling = require('@leveloneproject/central-services-error-handling')

exports.setup = () => {
  const fixtures = {}

  const server = new Hapi.Server()
  server.connection({
    port: 8000,
    routes: {
      validate: ErrorHandling.validateRoutes()
    }
  })

  server.register([ErrorHandling, require('../../src/api'), require('../../src/webhooks')])

  fixtures.server = server

  return fixtures
}

exports.buildRequest = (options) => {
  return { url: options.url, method: options.method || 'GET', payload: options.payload || '', headers: options.headers || {} }
}

exports.assertServerError = (assert, response) => {
  assert.equal(response.statusCode, 500)
  assert.equal(response.result.error, 'Internal Server Error')
  assert.equal(response.result.message, 'An internal server error occurred')
}

exports.assertNotFoundError = (assert, response) => {
  assert.equal(response.statusCode, 404)
  assert.equal(response.result.error, 'Not Found')
}

exports.assertBadRequestError = (assert, response, validationErrors) => {
  assert.equal(response.statusCode, 400)
  assert.equal(response.result.error_id, 'InvalidBodyError')
  assert.equal(response.result.message, 'Body does not match schema')
  assert.deepEqual(response.result.validation_errors, validationErrors)
}

exports.assertInvalidUriParameterError = (assert, response, validationErrors) => {
  assert.equal(response.statusCode, 400)
  assert.equal(response.result.error_id, 'InvalidUriParameterError')
  assert.equal(response.result.message, 'Error validating one or more uri parameters')
  assert.deepEqual(response.result.validation_errors, validationErrors)
}

exports.assertInvalidHeaderError = (assert, response, validationErrors) => {
  assert.equal(response.statusCode, 400)
  assert.equal(response.result.error_id, 'InvalidHeaderError')
  assert.equal(response.result.message, 'Error validating one or more headers')
  assert.deepEqual(response.result.validation_errors, validationErrors)
}
