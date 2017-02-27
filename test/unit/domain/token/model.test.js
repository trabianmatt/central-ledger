'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Model = require('../../../../src/domain/token/model')
const Db = require('../../../../src/db')
const Time = require('../../../../src/lib/time')

Test('tokens model', function (modelTest) {
  let sandbox
  let dbConnection
  let dbMethodsStub

  let tokensTable = 'tokens'

  let setupDatabase = (methodStubs = dbMethodsStub) => {
    dbConnection.withArgs(tokensTable).returns(methodStubs)
  }

  modelTest.beforeEach((t) => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Time, 'getCurrentUTCTimeInMilliseconds')
    dbMethodsStub = {
      insert: sandbox.stub(),
      where: sandbox.stub()
    }
    sandbox.stub(Db, 'connect')
    dbConnection = sandbox.stub()
    Db.connect.returns(P.resolve(dbConnection))
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

      dbMethodsStub.insert.returns(P.resolve([created]))
      setupDatabase()

      Model.create(payload)
        .then(c => {
          let insertArgs = dbMethodsStub.insert.firstCall.args
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

      dbMethodsStub.where.withArgs({ accountId: account.accountId }).returns(P.resolve(tokens))
      setupDatabase()

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
      dbMethodsStub.where.withArgs('expiration', '<=', currentTime).returns({ del: delStub })
      setupDatabase()

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
