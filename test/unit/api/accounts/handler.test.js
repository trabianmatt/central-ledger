'use strict'

const src = '../../../../src'
const Sinon = require('sinon')
const Test = require('tapes')(require('tape'))
const P = require('bluebird')
const Config = require(`${src}/lib/config`)
const Handler = require(`${src}/api/accounts/handler`)
const Model = require(`${src}/models/accounts`)
const PositionService = require(`${src}/services/position`)
const NotFoundError = require('@leveloneproject/central-services-shared').NotFoundError
const RecordExistsError = require(`${src}/errors/record-exists-error`)

let createGet = name => {
  return {
    params: { name: name || 'name' },
    server: { log: () => {} }
  }
}

let createPost = payload => {
  return {
    payload: payload || {},
    server: { log: () => { } }
  }
}

Test('accounts handler', handlerTest => {
  let sandbox
  let originalHostName
  let hostname = 'http://some-host'

  handlerTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    originalHostName = Config.HOSTNAME
    Config.HOSTNAME = hostname
    sandbox.stub(Model, 'create')
    sandbox.stub(Model, 'getByName')
    sandbox.stub(PositionService, 'calculateForAccount')
    t.end()
  })

  handlerTest.afterEach(t => {
    Config.HOSTNAME = originalHostName
    sandbox.restore()
    t.end()
  })

  const buildPosition = (accountName, payments, receipts, net) => {
    return {
      account: `${hostname}/accounts/${accountName}`,
      payments: payments,
      receipts: receipts,
      net: net
    }
  }

  handlerTest.test('getByName should', getByNameTest => {
    getByNameTest.test('get account by name and set balance to position', test => {
      let name = 'somename'
      let account = { accountId: 1, name: name, createdDate: new Date() }
      Model.getByName.returns(P.resolve(account))
      PositionService.calculateForAccount.withArgs(account).returns(P.resolve(buildPosition(account.name, '50', '0', '-50')))

      let reply = response => {
        test.equal(response.id, `${hostname}/accounts/${response.name}`)
        test.equal(response.name, name)
        test.equal(response.created, account.createdDate)
        test.equal(response.balance, '-50')
        test.equal(response.is_disabled, false)
        test.equal(response.ledger, hostname)
        test.end()
      }

      Handler.getByName(createGet(name), reply)
    })

    getByNameTest.test('reply with NotFoundError if account null', test => {
      Model.getByName.returns(P.resolve(null))

      let reply = response => {
        test.ok(response instanceof NotFoundError)
        test.equal(response.message, 'The requested resource could not be found.')
        test.end()
      }

      Handler.getByName(createGet(), reply)
    })

    getByNameTest.test('reply with error if model throws error', test => {
      let error = new Error()
      Model.getByName.returns(P.reject(error))

      let reply = e => {
        test.equal(e, error)
        test.end()
      }

      Handler.getByName(createGet(), reply)
    })

    getByNameTest.test('reply with NotFoundError if position null', test => {
      let name = 'somename'
      let account = { accountId: 1, name: name, createdDate: new Date() }
      Model.getByName.returns(P.resolve(account))

      PositionService.calculateForAccount.withArgs(account).returns(P.resolve(null))

      let reply = response => {
        test.ok(response instanceof NotFoundError)
        test.equal(response.message, 'The requested resource could not be found.')
        test.end()
      }

      Handler.getByName(createGet(), reply)
    })

    getByNameTest.test('reply with error if PositionService throws error', test => {
      let name = 'somename'
      let account = { accountId: 1, name: name, createdDate: new Date() }
      Model.getByName.returns(P.resolve(account))

      let error = new Error()
      PositionService.calculateForAccount.withArgs(account).returns(P.reject(error))

      let reply = e => {
        test.equal(e, error)
        test.end()
      }

      Handler.getByName(createGet(), reply)
    })

    getByNameTest.end()
  })

  handlerTest.test('create should', createTest => {
    createTest.test('return created account', assert => {
      let payload = { name: 'dfsp1' }
      let account = { name: payload.name, createdDate: new Date() }

      Model.getByName.withArgs(payload.name).returns(P.resolve(null))
      Model.create.withArgs(payload).returns(P.resolve(account))

      let reply = response => {
        console.log(response)
        assert.equal(response.id, `${hostname}/accounts/${account.name}`)
        assert.equal(response.name, account.name)
        assert.equal(response.created, account.createdDate)
        assert.equal(response.balance, '0')
        assert.equal(response.is_disabled, false)
        assert.equal(response.ledger, hostname)
        return {
          code: (statusCode) => {
            assert.equal(statusCode, 201)
            assert.end()
          }
        }
      }

      Handler.create(createPost(payload), reply)
    })

    createTest.test('return RecordExistsError if name already registered', test => {
      let payload = { name: 'dfsp1' }
      let account = { name: payload.name, createdDate: new Date() }

      Model.getByName.withArgs(payload.name).returns(P.resolve(account))

      let reply = response => {
        test.ok(response instanceof RecordExistsError)
        test.equal(response.message, 'The account has already been registered')
        test.end()
      }

      Handler.create(createPost(payload), reply)
    })

    createTest.test('return error if model throws error on checking for existing account', test => {
      let payload = { name: 'dfsp1' }
      let error = new Error()

      Model.getByName.returns(P.reject(error))

      let reply = e => {
        test.equal(e, error)
        test.end()
      }

      Handler.create(createPost(payload), reply)
    })

    createTest.test('return error if model throws error on register', test => {
      let payload = { name: 'dfsp1' }
      let error = new Error()

      Model.getByName.returns(P.resolve(null))
      Model.create.returns(P.reject(error))

      let reply = e => {
        test.equal(e, error)
        test.end()
      }

      Handler.create(createPost(payload), reply)
    })

    createTest.end()
  })

  handlerTest.end()
})
