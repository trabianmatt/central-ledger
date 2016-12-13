'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Uuid = require('uuid4')
const TokenAuth = require('../../../../src/api/auth/token')
const TokenService = require('../../../../src/domain/token')
const AccountService = require('../../../../src/domain/account')
const UnauthorizedError = require('@leveloneproject/central-services-auth').UnauthorizedError
const Crypto = require('../../../../src/lib/crypto')

const createRequest = (apiKey = null) => {
  return {
    headers: {
      'Ledger-Api-Key': apiKey
    }
  }
}

Test('Token Auth', tokenTest => {
  let sandbox

  tokenTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(AccountService, 'getByKey')
    sandbox.stub(TokenService, 'byAccount')
    sandbox.stub(Crypto, 'verifyHash')
    test.end()
  })

  tokenTest.afterEach(test => {
    sandbox.restore()
    test.end()
  })

  tokenTest.test('validate should', validateTest => {
    validateTest.test('be unauthorized if Ledger-Api-Key header not set', test => {
      const request = createRequest()

      const cb = (err) => {
        test.ok(err)
        test.ok(err instanceof UnauthorizedError)
        test.equal(err.message, '"Ledger-Api-Key" header is required')
        test.end()
      }

      TokenAuth.validate(request, 'token', cb)
    })

    validateTest.test('be unauthorized if Ledger-Api-Key not found', test => {
      const key = 'some-key'
      AccountService.getByKey.withArgs(key).returns(P.resolve(null))
      const request = createRequest(key)

      const cb = (err) => {
        test.ok(err)
        test.ok(err instanceof UnauthorizedError)
        test.equal(err.message, '"Ledger-Api-Key" header is not valid')
        test.end()
      }

      TokenAuth.validate(request, 'token', cb)
    })

    validateTest.test('be invalid if token not found by account', test => {
      const key = 'some-key'
      const accountId = Uuid().toString()
      const account = { accountId }
      AccountService.getByKey.withArgs(key).returns(P.resolve(account))
      TokenService.byAccount.withArgs(account).returns(P.resolve([]))
      const request = createRequest(key)

      const cb = (err, isValid) => {
        test.notOk(err)
        test.equal(isValid, false)
        test.end()
      }

      TokenAuth.validate(request, 'token', cb)
    })

    validateTest.test('be invalid if no account tokens can be verified', test => {
      const key = 'some-key'
      const token = 'token'
      const accountId = Uuid().toString()
      const account = { accountId }
      AccountService.getByKey.withArgs(key).returns(P.resolve(account))
      const tokens = [
        { token: 'bad-token1' },
        { token: 'bad-token2' }
      ]
      Crypto.verifyHash.returns(P.resolve(false))
      TokenService.byAccount.withArgs(account).returns(P.resolve(tokens))
      const request = createRequest(key)

      const cb = (err, isValid) => {
        test.notOk(err)
        test.equal(isValid, false)
        test.end()
      }

      TokenAuth.validate(request, token, cb)
    })

    validateTest.test('pass with account if one token can be verified', test => {
      const key = 'some-key'
      const token = 'token'
      const accountId = Uuid().toString()
      const account = { accountId }
      AccountService.getByKey.withArgs(key).returns(P.resolve(account))
      const tokens = [
        { token: 'bad-token1' },
        { token: 'bad-token2' },
        { token }
      ]
      Crypto.verifyHash.returns(P.resolve(false))
      Crypto.verifyHash.withArgs(token).returns(P.resolve(true))
      TokenService.byAccount.withArgs(account).returns(P.resolve(tokens))
      const request = createRequest(key)

      const cb = (err, isValid, credentials) => {
        test.notOk(err)
        test.equal(isValid, true)
        test.equal(credentials, account)
        test.end()
      }

      TokenAuth.validate(request, token, cb)
    })

    validateTest.end()
  })

  tokenTest.end()
})
