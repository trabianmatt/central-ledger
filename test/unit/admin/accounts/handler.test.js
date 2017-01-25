'use strict'

const Sinon = require('sinon')
const Test = require('tapes')(require('tape'))
const P = require('bluebird')
const Config = require('../../../../src/lib/config')
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
    sandbox.stub(Account, 'getAll')
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
