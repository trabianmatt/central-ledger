'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const AccountService = require('../../../../src/domain/account')
const AccountAuth = require('../../../../src/api/auth/account')

Test('account auth module', authTest => {
  let sandbox

  authTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(AccountService)
    t.end()
  })

  authTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  authTest.test('name should be account', test => {
    test.equal(AccountAuth.name, 'account')
    test.end()
  })

  authTest.test('scheme should be basic', test => {
    test.equal(AccountAuth.scheme, 'basic')
    test.end()
  })

  authTest.test('validate should', validateTest => {
    validateTest.test('return false if password missing', test => {
      const cb = (err, isValid) => {
        test.notOk(err)
        test.equal(isValid, false)
        test.end()
      }

      AccountAuth.validate({}, 'username', '', cb)
    })

    validateTest.test('return false if password cannot be verified', test => {
      const key = 'key'
      const secret = 'secret'
      AccountService.verify.withArgs(key, secret).returns(P.reject({}))

      const cb = (err, isValid) => {
        test.notOk(err)
        test.equal(isValid, false)
        test.end()
      }

      AccountAuth.validate({}, key, secret, cb)
    })

    validateTest.test('return true and account if password verified', test => {
      const key = 'key'
      const secret = 'secret'
      const account = { key, secret }
      AccountService.verify.withArgs(key, secret).returns(P.resolve(account))

      const cb = (err, isValid, credentials) => {
        test.notOk(err)
        test.equal(isValid, true)
        test.equal(credentials, account)
        test.end()
      }

      AccountAuth.validate({}, key, secret, cb)
    })

    validateTest.end()
  })

  authTest.end()
})
