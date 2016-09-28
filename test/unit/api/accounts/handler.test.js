'use strict'

const Sinon = require('sinon')
const Test = require('tapes')(require('tape'))
const Boom = require('boom')
const P = require('bluebird')
const Config = require('../../../../src/lib/config')
const Handler = require('../../../../src/api/accounts/handler')
const Model = require('../../../../src/models/accounts')

var createGet = name => {
  return {
    params: { name: name || 'name' },
    server: { log: () => {} }
  }
}

var createPost = payload => {
  return {
    payload: payload || {},
    server: { log: () => { } }
  }
}

Test('accounts handler', function (handlerTest) {
  let sandbox
  let originalHostName
  let hostname = 'http://some-host'

  handlerTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    originalHostName = Config.HOSTNAME
    Config.HOSTNAME = hostname
    t.end()
  })

  handlerTest.afterEach(t => {
    Config.HOSTNAME = originalHostName
    sandbox.restore()
    t.end()
  })

  handlerTest.test('getByName should', getByNameTest => {
    getByNameTest.test('get account by name', assert => {
      let name = 'somename'
      let account = { name: name, createdDate: new Date() }
      sandbox.stub(Model, 'getByName').returns(P.resolve(account))

      let reply = response => {
        assert.equal(response.id, `${hostname}/accounts/${response.name}`)
        assert.equal(response.name, name)
        assert.equal(response.created, account.createdDate)
        assert.equal(response.balance, 1000000.00)
        assert.equal(response.is_disabled, false)
        assert.equal(response.ledger, hostname)
        return {
          code: statusCode => {
            assert.equal(statusCode, 200)
            assert.end()
          }
        }
      }
      Handler.getByName(createGet(name), reply)
    })

    getByNameTest.test('return 404 if account null', assert => {
      sandbox.stub(Model, 'getByName').returns(P.resolve(null))
      let reply = response => {
        assert.deepEqual(response, Boom.notFound())
        assert.end()
      }

      Handler.getByName(createGet(), reply)
    })

    getByNameTest.test('return error if model throws error', assert => {
      let error = new Error()
      sandbox.stub(Model, 'getByName').returns(P.reject(error))
      let reply = response => {
        assert.deepEqual(response, Boom.wrap(error))
        assert.end()
      }

      Handler.getByName(createGet(), reply)
    })

    getByNameTest.end()
  })

  handlerTest.test('create should', createTest => {
    createTest.test('return created account', assert => {
      let payload = { name: 'dfsp1' }
      let account = { name: payload.name, createdDate: new Date() }
      sandbox.stub(Model, 'getByName').withArgs(payload.name).returns(P.resolve(null))
      sandbox.stub(Model, 'create').withArgs(payload).returns(P.resolve(account))

      let reply = response => {
        assert.equal(response.id, `${hostname}/accounts/${account.name}`)
        assert.equal(response.name, account.name)
        assert.equal(response.created, account.createdDate)
        assert.equal(response.balance, 1000000.00)
        assert.equal(response.is_disabled, false)
        assert.equal(response.ledger, hostname)
        return {
          code: function (statusCode) {
            assert.equal(statusCode, 201)
            assert.end()
          }
        }
      }

      Handler.create(createPost(payload), reply)
    })

    createTest.test('return error if name already registered', assert => {
      let payload = { name: 'dfsp1' }
      let account = { name: payload.name, createdDate: new Date() }
      sandbox.stub(Model, 'getByName').withArgs(payload.name).returns(P.resolve(account))

      let reply = function (response) {
        assert.deepEqual(response, Boom.badRequest('The account has already been registered'))
        assert.end()
      }

      Handler.create(createPost(payload), reply)
    })

    createTest.test('return error if model throws error on checking for existing account', assert => {
      let payload = { name: 'dfsp1' }
      let error = new Error()
      sandbox.stub(Model, 'getByName').returns(P.reject(error))

      let reply = response => {
        assert.deepEqual(response, Boom.wrap(error))
        assert.end()
      }

      Handler.create(createPost(payload), reply)
    })

    createTest.test('return error if model throws error on register', assert => {
      let payload = { name: 'dfsp1' }
      let error = new Error()
      sandbox.stub(Model, 'getByName').returns(P.resolve(null))
      sandbox.stub(Model, 'create').returns(P.reject(error))

      let reply = response => {
        assert.deepEqual(response, Boom.wrap(error))
        assert.end()
      }

      Handler.create(createPost(payload), reply)
    })

    createTest.end()
  })

  handlerTest.end()
})
