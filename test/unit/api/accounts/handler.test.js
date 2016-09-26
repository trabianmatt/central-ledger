'use strict'

const Proxyquire = require('proxyquire')
const Sinon = require('sinon')
const Test = require('tape')
const Boom = require('boom')
const P = require('bluebird')

function createHandler (model) {
  return Proxyquire('../../../../src/api/accounts/handler', {
    './model': model
  })
}

var createGet = name => {
  return {
    params: { name: name || 'name' },
    server: { log: () => {} }
  }
}

var createPost = payload => {
  let requestPayload = payload || {}
  return {
    payload: requestPayload,
    server: { log: () => { } }
  }
}

Test('accounts handler', function (handlerTest) {
  handlerTest.test('getByName should', getByNameTest => {
    getByNameTest.test('get account by name', assert => {
      let name = 'somename'
      let account = { name: name, createdDate: new Date() }
      let model = {
        getByName: Sinon.stub().returns(P.resolve(account))
      }
      let reply = response => {
        assert.equal(response.name, name)
        assert.equal(response.created, account.createdDate)
        assert.equal(response.balance, 1000000.00)
        assert.equal(response.is_disabled, false)
        return {
          code: statusCode => {
            assert.equal(statusCode, 200)
            assert.end()
          }
        }
      }
      createHandler(model).getByName(createGet(name), reply)
    })

    getByNameTest.test('return 404 if account null', assert => {
      let model = { getByName: Sinon.stub().returns(P.resolve(null)) }
      let reply = response => {
        assert.deepEqual(response, Boom.notFound())
        assert.end()
      }

      createHandler(model).getByName(createGet(), reply)
    })

    getByNameTest.test('return error if model throws error', assert => {
      let error = new Error()
      let model = { getByName: () => { return P.reject(error) } }
      let reply = response => {
        assert.deepEqual(response, Boom.wrap(error))
        assert.end()
      }

      createHandler(model).getByName(createGet(), reply)
    })

    getByNameTest.end()
  })

  handlerTest.test('create should', createTest => {
    createTest.test('return created account', assert => {
      let payload = { name: 'dfsp1' }
      let account = { name: payload.name, createdDate: new Date() }
      let model = {
        getByName: Sinon.stub().withArgs(payload.name).returns(P.resolve(null)),
        create: Sinon.stub().withArgs(payload).returns(P.resolve(account))
      }

      let reply = response => {
        assert.equal(response.name, account.name)
        assert.equal(response.created, account.createdDate)
        assert.equal(response.balance, 1000000.00)
        assert.equal(response.is_disabled, false)
        return {
          code: function (statusCode) {
            assert.equal(statusCode, 201)
            assert.end()
          }
        }
      }

      createHandler(model).create(createPost(payload), reply)
    })

    createTest.test('return error if name already registered', assert => {
      let payload = { name: 'dfsp1' }
      let account = { name: payload.name, createdDate: new Date() }
      let model = {
        getByName: Sinon.stub().withArgs(payload.name).returns(P.resolve(account))
      }

      let reply = function (response) {
        assert.deepEqual(response, Boom.badRequest('The account has already been registered'))
        assert.end()
      }

      createHandler(model).create(createPost(payload), reply)
    })

    createTest.test('return error if model throws error on checking for existing account', assert => {
      let payload = { name: 'dfsp1' }
      let error = new Error()
      let model = {
        getByName: function (name) { return P.reject(error) }
      }

      let reply = response => {
        assert.deepEqual(response, Boom.wrap(error))
        assert.end()
      }

      createHandler(model).create(createPost(payload), reply)
    })

    createTest.test('return error if model throws error on register', assert => {
      let payload = { name: 'dfsp1' }
      let error = new Error()
      let model = {
        getByName: Sinon.stub().returns(P.resolve(null)),
        create: function (data) { return P.reject(error) }
      }

      let reply = response => {
        assert.deepEqual(response, Boom.wrap(error))
        assert.end()
      }

      createHandler(model).create(createPost(payload), reply)
    })

    createTest.end()
  })

  handlerTest.end()
})
