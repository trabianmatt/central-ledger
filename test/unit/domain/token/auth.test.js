'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Uuid = require('uuid4')
const TokenService = require('../../../../src/domain/token')
const AccountService = require('../../../../src/domain/account')
const UnauthorizedError = require('@leveloneproject/central-services-auth').UnauthorizedError
const Crypto = require('../../../../src/lib/crypto')
const Config = require('../../../../src/lib/config')

const TokenAuth = require('../../../../src/domain/token/auth')

const createRequest = (apiKey = null) => {
  return {
    headers: {
      'ledger-api-key': apiKey
    }
  }
}

Test('Token Auth', tokenTest => {
  let sandbox
  let originalAdminKey
  let originalTokenExpiration

  tokenTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(AccountService, 'getByName')
    sandbox.stub(TokenService, 'byAccount')
    sandbox.stub(Crypto, 'verifyHash')
    originalAdminKey = Config.ADMIN_KEY
    originalTokenExpiration = Config.TOKEN_EXPIRATION
    test.end()
  })

  tokenTest.afterEach(test => {
    sandbox.restore()
    Config.ADMIN_KEY = originalAdminKey
    Config.TOKEN_EXPIRATION = originalTokenExpiration
    test.end()
  })

  tokenTest.test('all token validate should', validateTest => {
    validateTest.test('be unauthorized if Ledger-Api-Key header not set', test => {
      const request = createRequest()

      const cb = (err) => {
        test.ok(err)
        test.ok(err instanceof UnauthorizedError)
        test.equal(err.message, '"Ledger-Api-Key" header is required')
        test.end()
      }

      TokenAuth.validate(false)(request, 'token', cb)
    })

    validateTest.test('be unauthorized if Ledger-Api-Key not found', test => {
      const name = 'some-name'
      AccountService.getByName.withArgs(name).returns(P.resolve(null))
      const request = createRequest(name)

      const cb = (err) => {
        test.ok(err)
        test.ok(err instanceof UnauthorizedError)
        test.equal(err.message, '"Ledger-Api-Key" header is not valid')
        test.end()
      }

      TokenAuth.validate(false)(request, 'token', cb)
    })

    validateTest.test('be invalid if token not found by account', test => {
      const name = 'some-name'
      const accountId = Uuid().toString()
      const account = { accountId }
      AccountService.getByName.withArgs(name).returns(P.resolve(account))
      TokenService.byAccount.withArgs(account).returns(P.resolve([]))
      const request = createRequest(name)

      const cb = (err, isValid) => {
        test.notOk(err)
        test.equal(isValid, false)
        test.end()
      }

      TokenAuth.validate(false)(request, 'token', cb)
    })

    validateTest.test('be invalid if no account tokens can be verified', test => {
      const name = 'some-name'
      const token = 'token'
      const accountId = Uuid().toString()
      const account = { accountId }
      AccountService.getByName.withArgs(name).returns(P.resolve(account))
      const tokens = [
        { token: 'bad-token1' },
        { token: 'bad-token2' }
      ]
      Crypto.verifyHash.returns(P.resolve(false))
      TokenService.byAccount.withArgs(account).returns(P.resolve(tokens))
      const request = createRequest(name)

      const cb = (err, isValid) => {
        test.notOk(err)
        test.equal(isValid, false)
        test.end()
      }

      TokenAuth.validate(false)(request, token, cb)
    })

    validateTest.test('pass with account if one token can be verified', test => {
      const name = 'some-name'
      const token = 'token'
      const accountId = Uuid().toString()
      const account = { accountId }
      AccountService.getByName.withArgs(name).returns(P.resolve(account))
      const tokens = [
        { token: 'bad-token1' },
        { token: 'bad-token2' },
        { token }
      ]
      Crypto.verifyHash.returns(P.resolve(false))
      Crypto.verifyHash.withArgs(token).returns(P.resolve(true))
      TokenService.byAccount.withArgs(account).returns(P.resolve(tokens))
      const request = createRequest(name)

      const cb = (err, isValid, credentials) => {
        test.notOk(err)
        test.equal(isValid, true)
        test.equal(credentials, account)
        test.end()
      }

      TokenAuth.validate(false)(request, token, cb)
    })

    validateTest.test('be invalid if a token has expired', test => {
      const name = 'some-name'
      const tokenVal = 'token'
      const expiration = 1
      const token = { token: tokenVal, expiration }
      const bearer = 'bearer'
      const accountId = Uuid().toString()
      const account = { accountId }
      AccountService.getByName.withArgs(name).returns(P.resolve(account))
      const tokens = [
        token
      ]
      Crypto.verifyHash.returns(P.resolve(false))
      Crypto.verifyHash.withArgs(token.token, bearer).returns(P.resolve(true))
      TokenService.byAccount.withArgs(account).returns(P.resolve(tokens))
      const request = createRequest(name)
      Config.TOKEN_EXPIRATION = 1

      const cb = (err, isValid, credentials) => {
        test.notOk(err)
        test.equal(isValid, false)
        test.equal(credentials, account)
        test.end()
      }

      TokenAuth.validate(false)(request, bearer, cb)
    })

    validateTest.end()
  })

  tokenTest.test('admin token validate should', validateTest => {
    validateTest.test('return invalid if admin only and key is not admin key', test => {
      const adminKey = 'ADMIN_KEY'
      Config.ADMIN_KEY = adminKey

      const notAdminKey = 'not_admin_key'
      const request = createRequest(notAdminKey)

      const cb = (err, isValid) => {
        test.notOk(err)
        test.equal(isValid, false)
        test.end()
      }

      TokenAuth.validate(true)(request, 'token', cb)
    })

    validateTest.test('return admin if admin only and key is admin key', test => {
      const adminKey = 'some-admin-key'
      Config.ADMIN_KEY = adminKey
      const request = createRequest(adminKey)
      const token = 'token'

      TokenService.byAccount.returns(P.resolve([{ token }]))
      Crypto.verifyHash.returns(P.resolve(false))
      Crypto.verifyHash.withArgs(token).returns(P.resolve(true))

      const cb = (err, isValid, credentials) => {
        test.notOk(err)
        test.equal(isValid, true)
        test.equal(credentials.is_admin, true)
        test.notOk(credentials.accountId)
        test.end()
      }

      TokenAuth.validate(true)(request, token, cb)
    })

    validateTest.end()
  })

  tokenTest.end()
})
