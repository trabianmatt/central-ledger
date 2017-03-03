'use strict'

const Sinon = require('sinon')
const Test = require('tapes')(require('tape'))
const P = require('bluebird')
const Config = require('../../../../src/lib/config')
const Errors = require('../../../../src/errors')
const UrlParser = require('../../../../src/lib/urlparser')
const Handler = require('../../../../src/admin/accounts/handler')
const Account = require('../../../../src/domain/account')

Test('accounts handler', handlerTest => {
  let sandbox
  let originalHostName
  let hostname = 'http://some-host'

  handlerTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    originalHostName = Config.HOSTNAME
    Config.HOSTNAME = hostname
    sandbox.stub(Account)
    t.end()
  })

  handlerTest.afterEach(t => {
    Config.HOSTNAME = originalHostName
    sandbox.restore()
    t.end()
  })

  handlerTest.test('getAll should', getAllTest => {
    getAllTest.test('get all accounts and format list', test => {
      const account1 = {
        name: 'account1',
        createdDate: new Date(),
        isDisabled: false
      }
      const account2 = {
        name: 'account2',
        createdDate: new Date(),
        isDisabled: false
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

  handlerTest.test('updateAccount should', updateAccountTest => {
    updateAccountTest.test('update an account to disabled', test => {
      const account = {
        name: 'account1',
        id: `${hostname}/accounts/account1`,
        isDisabled: true,
        createdDate: new Date()
      }

      Account.update.returns(P.resolve(account))

      const reply = response => {
        test.equal(response.name, account.name)
        test.equal(response.id, `${hostname}/accounts/${account.name}`)
        test.equal(response.is_disabled, account.isDisabled)
        test.equal(response.created, account.createdDate)
        test.end()
      }

      const request = {
        payload: {is_disabled: false},
        params: { name: 'name' }
      }

      Handler.update(request, reply)
    })

    updateAccountTest.test('reply with error if Account services throws', test => {
      const error = new Error()
      Account.update.returns(P.reject(error))

      const request = {
        payload: {is_disabled: false},
        params: { name: 'name' }
      }

      const reply = (e) => {
        test.equal(e, error)
        test.end()
      }

      Handler.update(request, reply)
    })

    updateAccountTest.end()
  })

  handlerTest.test('create should', createTest => {
    createTest.test('return created account', test => {
      const payload = { name: 'dfsp1', password: 'dfsp1' }
      const account = { name: payload.name, createdDate: 'today', isDisabled: true }
      Account.getByName.returns(P.resolve(null))
      Account.create.withArgs(payload).returns(P.resolve(account))
      const accountId = UrlParser.toAccountUri(account.name)
      const reply = (response) => {
        test.equal(response.id, accountId)
        test.equal(response.is_disabled, account.isDisabled)
        test.equal(response.created, account.createdDate)
        return {
          code: (statusCode) => {
            test.equal(statusCode, 201)
            test.end()
          }
        }
      }

      Handler.create({ payload }, reply)
    })

    createTest.test('return RecordExistsError if name already registered', test => {
      const payload = { name: 'dfsp1', password: 'dfsp1' }
      Account.getByName.returns(P.resolve({}))

      const reply = response => {
        test.ok(response instanceof Errors.RecordExistsError)
        test.equal(response.message, 'The account has already been registered')
        test.end()
      }

      Handler.create({ payload }, reply)
    })

    createTest.end()
  })

  handlerTest.end()
})
