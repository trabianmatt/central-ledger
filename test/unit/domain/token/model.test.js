'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Model = require('../../../../src/domain/token/model')
const Db = require('../../../../src/db')
const Time = require('../../../../src/lib/time')

Test('tokens model', function (modelTest) {
  let sandbox
  let tokensStubs

  let tokensTable = 'tokens'

  modelTest.beforeEach((t) => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Time, 'getCurrentUTCTimeInMilliseconds')

    tokensStubs = {
      insert: sandbox.stub(),
      where: sandbox.stub()
    }

    Db.connection = sandbox.stub()
    Db.connection.withArgs(tokensTable).returns(tokensStubs)

    t.end()
  })

  modelTest.afterEach((t) => {
    sandbox.restore()
    t.end()
  })

  modelTest.test('create should', createTest => {
    createTest.test('save payload and return new token', test => {
      const payload = { accountId: 1, token: 'token', expiration: new Date().getTime() }
      const created = { tokenId: 1 }

      tokensStubs.insert.returns(P.resolve([created]))

      Model.create(payload)
        .then(c => {
          let insertArgs = tokensStubs.insert.firstCall.args
          test.notEqual(insertArgs[0], payload)
          test.equal(insertArgs[0].accountId, payload.accountId)
          test.equal(insertArgs[0].token, payload.token)
          test.equal(insertArgs[0].expiration, payload.expiration)
          test.equal(insertArgs[1], '*')
          test.equal(c, created)
          test.end()
        })
    })

    createTest.end()
  })

  modelTest.test('byAccount should', byAccountTest => {
    byAccountTest.test('return Model byAccount', test => {
      const account = { accountId: 1 }
      const tokens = [ { accountId: account.accountId, token: 'token1' }, { accountId: account.accountId, token: 'token2' } ]

      tokensStubs.where.withArgs({ accountId: account.accountId }).returns(P.resolve(tokens))

      Model.byAccount(account)
        .then(results => {
          test.equal(results, tokens)
          test.end()
        })
    })

    byAccountTest.end()
  })

  modelTest.test('removeExpired should', removeExpiredTest => {
    removeExpiredTest.test('remove expired tokens', test => {
      const currentTime = 1
      Time.getCurrentUTCTimeInMilliseconds.returns(currentTime)

      const expiredTokens = [ { accountId: 1, token: 'token', expiration: 1 } ]

      let delStub = sandbox.stub().returns(P.resolve(expiredTokens))
      tokensStubs.where.withArgs('expiration', '<=', currentTime).returns({ del: delStub })

      Model.removeExpired()
        .then(removed => {
          test.ok(delStub.withArgs('*').calledOnce)
          test.equal(removed, expiredTokens)
          test.end()
        })
    })

    removeExpiredTest.end()
  })

  modelTest.end()
})
