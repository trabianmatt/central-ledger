'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Model = require('../../../../src/domain/token/model')
const Db = require('../../../../src/db')

Test('tokens model', function (modelTest) {
  let sandbox

  function setupTokensDb (tokens) {
    sandbox.stub(Db, 'connect').returns(Promise.resolve({ tokens: tokens }))
  }

  modelTest.beforeEach((t) => {
    sandbox = Sinon.sandbox.create()
    t.end()
  })

  modelTest.afterEach((t) => {
    sandbox.restore()
    t.end()
  })

  modelTest.test('create should', createTest => {
    createTest.test('save payload as new object', test => {
      const saveAsync = Sinon.stub()
      setupTokensDb({ saveAsync: saveAsync })
      const payload = { accountId: 1, token: 'token' }

      Model.create(payload)
        .then(() => {
          let saveAsyncArg = saveAsync.firstCall.args[0]
          test.notEqual(saveAsyncArg, payload)
          test.equal(saveAsyncArg.accountId, payload.accountId)
          test.equal(saveAsyncArg.token, payload.token)
          test.end()
        })
    })

    createTest.test('return newly created token', test => {
      let newToken = { accountId: 1, token: 'token' }
      let saveAsync = Sinon.stub().returns(newToken)
      setupTokensDb({ saveAsync: saveAsync })

      Model.create({})
        .then(s => {
          test.equal(s, newToken)
          test.end()
        })
        .catch(err => {
          test.fail(err)
        })
    })

    createTest.end()
  })

  modelTest.test('byToken should', byTokenTest => {
    byTokenTest.test('return Model byToken', test => {
      const findAsync = Sinon.stub()
      setupTokensDb({ findAsync: findAsync })

      const account = { accountId: 1 }
      Model.byAccount(account)
        .then(() => {
          test.ok(findAsync.calledWith(Sinon.match({ accountId: account.accountId })))
          test.end()
        })
    })

    byTokenTest.end()
  })

  modelTest.end()
})
