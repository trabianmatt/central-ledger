'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const TokenService = require('../../../../src/domain/token')
const Model = require('../../../../src/domain/token/model')
const Crypto = require('../../../../src/lib/crypto')

Test('Token Service', serviceTest => {
  let sandbox

  serviceTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Crypto)
    sandbox.stub(Model)
    test.end()
  })

  serviceTest.afterEach(test => {
    sandbox.restore()
    test.end()
  })

  serviceTest.test('create should', createTest => {
    createTest.test('generate token and save hash to model', test => {
      const accountId = 1234
      const account = { accountId }
      const token = 'token'
      const tokenHash = 'tokenHash'
      const encodedTokenHash = tokenHash
      Crypto.generateToken.returns(P.resolve(token))
      Crypto.hash.withArgs(token).returns(P.resolve(tokenHash))
      Model.create.returns(P.resolve({ accountId, token: encodedTokenHash }))
      TokenService.create(account)
        .then(result => {
          test.equal(result.token, token)
          test.ok(Model.create.calledWith(Sinon.match({ accountId, token: encodedTokenHash })))
          test.end()
        })
    })
    createTest.end()
  })

  serviceTest.test('byAccount should', byAccountTest => {
    byAccountTest.test('return byToken from Model', test => {
      const accountId = 1
      const account = { accountId }
      Model.byAccount.returns(P.resolve([]))
      TokenService.byAccount(account)
        .then(result => {
          test.ok(Model.byAccount.calledWith(Sinon.match({ accountId })))
          test.end()
        })
    })

    byAccountTest.end()
  })

  serviceTest.end()
})
