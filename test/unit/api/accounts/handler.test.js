'use strict'

const Sinon = require('sinon')
const Test = require('tapes')(require('tape'))
const P = require('bluebird')
const Config = require('../../../../src/lib/config')
const Handler = require('../../../../src/api/accounts/handler')
const Account = require('../../../../src/domain/account')
const PositionService = require('../../../../src/services/position')
const NotFoundError = require('@leveloneproject/central-services-shared').NotFoundError
const RecordExistsError = require('../../../../src/errors/record-exists-error')

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
    sandbox.stub(Account, 'create')
    sandbox.stub(Account, 'getByName')
    sandbox.stub(Account, 'getAll')
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
      Account.getByName.returns(P.resolve(account))
      PositionService.calculateForAccount.withArgs(account).returns(P.resolve(buildPosition(account.name, '50', '0', '-50')))

      let reply = response => {
        test.equal(response.id, `${hostname}/accounts/${response.name}`)
        test.equal(response.name, name)
        test.equal(response.created, account.createdDate)
        test.equal(response.balance, '-50')
        test.equal(response.is_disabled, false)
        test.equal(response.ledger, hostname)
        test.notOk(response.hasOwnProperty['key'])
        test.notOk(response.hasOwnProperty['secret'])
        test.notOk(response.hasOwnProperty['credentials'])
        test.end()
      }

      Handler.getByName(createGet(name), reply)
    })

    getByNameTest.test('reply with NotFoundError if account null', test => {
      Account.getByName.returns(P.resolve(null))

      let reply = response => {
        test.ok(response instanceof NotFoundError)
        test.equal(response.message, 'The requested resource could not be found.')
        test.end()
      }

      Handler.getByName(createGet(), reply)
    })

    getByNameTest.test('reply with error if Account throws error', test => {
      let error = new Error()
      Account.getByName.returns(P.reject(error))

      let reply = e => {
        test.equal(e, error)
        test.end()
      }

      Handler.getByName(createGet(), reply)
    })

    getByNameTest.test('reply with NotFoundError if position null', test => {
      let name = 'somename'
      let account = { accountId: 1, name: name, createdDate: new Date() }
      Account.getByName.returns(P.resolve(account))

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
      Account.getByName.returns(P.resolve(account))

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
      let credentials = { key: 'key', secret: 'secret' }
      let account = { name: payload.name, createdDate: new Date(), credentials }

      Account.getByName.withArgs(payload.name).returns(P.resolve(null))
      Account.create.withArgs(payload).returns(P.resolve(account))

      let reply = response => {
        assert.equal(response.id, `${hostname}/accounts/${account.name}`)
        assert.equal(response.name, account.name)
        assert.equal(response.created, account.createdDate)
        assert.equal(response.balance, '0')
        assert.equal(response.is_disabled, false)
        assert.equal(response.ledger, hostname)
        assert.equal(response.credentials.key, credentials.key)
        assert.equal(response.credentials.secret, credentials.secret)
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

      Account.getByName.withArgs(payload.name).returns(P.resolve(account))

      let reply = response => {
        test.ok(response instanceof RecordExistsError)
        test.equal(response.message, 'The account has already been registered')
        test.end()
      }

      Handler.create(createPost(payload), reply)
    })

    createTest.test('return error if Account throws error on checking for existing account', test => {
      let payload = { name: 'dfsp1' }
      let error = new Error()

      Account.getByName.returns(P.reject(error))

      let reply = e => {
        test.equal(e, error)
        test.end()
      }

      Handler.create(createPost(payload), reply)
    })

    createTest.test('return error if Account throws error on register', test => {
      let payload = { name: 'dfsp1' }
      let error = new Error()

      Account.getByName.returns(P.resolve(null))
      Account.create.returns(P.reject(error))

      let reply = e => {
        test.equal(e, error)
        test.end()
      }

      Handler.create(createPost(payload), reply)
    })

    createTest.end()
  })

  handlerTest.test('getAll should', getAllTest => {
    getAllTest.test('get all accounts and format list', test => {
      const account1 = {
        name: 'account1',
        createdDate: new Date()
      }
      const account2 = {
        name: 'account2',
        createdDate: new Date()
      }
      const accounts = [account1, account2]

      Account.getAll.returns(P.resolve(accounts))

      const reply = response => {
        test.equal(response.length, 2)
        const item1 = response[0]
        test.equal(item1.name, account1.name)
        test.equal(item1.id, `${hostname}/accounts/${account1.name}`)
        test.equal(item1.is_disabled, false)
        test.equal(item1.created, account1.createdDate)
        test.equal(item1._links.self, `${hostname}/accounts/${account1.name}`)
        const item2 = response[1]
        test.equal(item2.name, account2.name)
        test.equal(item2.id, `${hostname}/accounts/${account2.name}`)
        test.equal(item2.is_disabled, false)
        test.equal(item2.created, account2.createdDate)
        test.equal(item2._links.self, `${hostname}/accounts/${account2.name}`)
        test.end()
      }

      Handler.getAll({}, reply)
    })

    getAllTest.test('reply with error if Account services throws', test => {
      const error = new Error()
      Account.getAll.returns(P.reject(error))

      const reply = (e) => {
        test.equal(e, error)
        test.end()
      }
      Handler.getAll({}, reply)
    })

    getAllTest.end()
  })

  handlerTest.end()
})
