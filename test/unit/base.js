'use strict'

const Path = require('path')
const Glue = require('glue')
const Manifest = require('../../src/manifest')

let serverPromise

const setupServer = () => {
  if (!serverPromise) {
    let serverPath = Path.normalize(Path.join(__dirname, '../../src/'))
    serverPromise = Glue.compose(Manifest, { relativeTo: serverPath })
  }
  return serverPromise
}

exports.setup = (connection = 'api') => {
  return setupServer().then(server => server.select(connection))
}

exports.buildRequest = (options) => {
  return { url: options.url, method: options.method || 'GET', payload: options.payload || '', headers: options.headers || {} }
}

exports.assertBadRequestError = (assert, response, validationErrors) => {
  assert.equal(response.statusCode, 400)
  assert.equal(response.result.id, 'InvalidBodyError')
  assert.equal(response.result.message, 'Body does not match schema')
  assert.deepEqual(response.result.validationErrors, validationErrors)
}

exports.assertInvalidUriParameterError = (assert, response, validationErrors) => {
  assert.equal(response.statusCode, 400)
  assert.equal(response.result.id, 'InvalidUriParameterError')
  assert.equal(response.result.message, 'Error validating one or more uri parameters')
  assert.deepEqual(response.result.validationErrors, validationErrors)
}

exports.assertInvalidHeaderError = (assert, response, validationErrors) => {
  assert.equal(response.statusCode, 400)
  assert.equal(response.result.id, 'InvalidHeaderError')
  assert.equal(response.result.message, 'Error validating one or more headers')
  assert.deepEqual(response.result.validationErrors, validationErrors)
}
