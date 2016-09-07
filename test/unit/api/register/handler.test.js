'use strict'

const Proxyquire = require('proxyquire')
const Sinon = require('sinon')
const Test = require('tape')
const Boom = require('boom')

function createHandler (model) {
  return Proxyquire('../../../../src/api/register/handler', {
    './model': model
  })
}

function createRequest (payload) {
  let requestPayload = payload || {}
  return {
    payload: requestPayload,
    server: {
      log: function () { }
    }
  }
}

Test('register handler', function (handlerTest) {
  handlerTest.test('register should', function (registerTest) {
    registerTest.test('return created registration', function (assert) {
      let payload = { identifier: 'dfsp1', name: 'name' }
      let registration = { identifier: payload.identifier, name: payload.name, createdDate: new Date() }
      let model = {
        getByIdentifier: Sinon.stub().withArgs(payload.identifier).returns(Promise.resolve(null)),
        create: Sinon.stub().withArgs(payload).returns(Promise.resolve(registration))
      }

      let reply = function (response) {
        assert.equal(response.identifier, registration.identifier)
        assert.equal(response.name, registration.name)
        assert.equal(response.created, registration.createdDate)
        return {
          code: function (statusCode) {
            assert.equal(statusCode, 201)
            assert.end()
          }
        }
      }

      createHandler(model).register(createRequest(payload), reply)
    })

    registerTest.test('return error if identifier already registered', function (assert) {
      let payload = { identifier: 'dfsp1', name: 'name' }
      let registration = { identifier: payload.identifier, name: payload.name, createdDate: new Date() }
      let model = {
        getByIdentifier: Sinon.stub().withArgs(payload.identifier).returns(Promise.resolve(registration))
      }

      let reply = function (response) {
        let boomError = Boom.badRequest('The identifier has already been registered')
        assert.deepEqual(response, boomError)
        assert.end()
      }

      createHandler(model).register(createRequest(payload), reply)
    })

    registerTest.test('return error if model throws error on checking for existing registration', function (assert) {
      let payload = { identifier: 'dfsp1', name: 'name' }
      let error = new Error()
      let model = {
        getByIdentifier: function (identifier) { return Promise.reject(error) }
      }

      let reply = function (response) {
        let boomError = Boom.wrap(error)
        assert.deepEqual(response, boomError)
        assert.end()
      }

      createHandler(model).register(createRequest(payload), reply)
    })

    registerTest.test('return error if model throws error on register', function (assert) {
      let payload = { identifier: 'dfsp1', name: 'name' }
      let error = new Error()
      let model = {
        getByIdentifier: Sinon.stub().returns(Promise.resolve(null)),
        create: function (data) { return Promise.reject(error) }
      }

      let reply = function (response) {
        let boomError = Boom.wrap(error)
        assert.deepEqual(response, boomError)
        assert.end()
      }

      createHandler(model).register(createRequest(payload), reply)
    })

    registerTest.end()
  })

  handlerTest.end()
})
