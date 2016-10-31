'use strict'

const src = '../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Model = require(`${src}/models/accounts`)
const Db = require(`${src}/db`)

Test('accounts model', function (modelTest) {
  let sandbox

  function setupAccountsDb (accounts) {
    sandbox.stub(Db, 'connect').returns(Promise.resolve({ accounts: accounts }))
  }

  modelTest.beforeEach((t) => {
    sandbox = Sinon.sandbox.create()
    t.end()
  })

  modelTest.afterEach((t) => {
    sandbox.restore()
    t.end()
  })

  modelTest.test('getByName should', function (getByName) {
    getByName.test('return exception if db.connect throws', function (assert) {
      let error = new Error()
      sandbox.stub(Db, 'connect').returns(Promise.reject(error))
      Model.getByName('dfsp1')
        .then(() => {
          assert.fail('Should have thrown error')
        })
        .catch(err => {
          assert.equal(err, error)
          assert.end()
        })
    })

    getByName.test('return exception if db.findOneAsync throws', function (assert) {
      let error = new Error()
      let findOneAsync = function () { return Promise.reject(error) }
      setupAccountsDb({ findOneAsync: findOneAsync })

      Model.getByName('dfsp1')
        .then(() => {
          assert.fail('Should have thrown error')
        })
        .catch(err => {
          assert.equal(err, error)
          assert.end()
        })
    })

    getByName.test('finds account by name', function (assert) {
      let name = 'dfsp1'
      let account = { name: name }
      let findOneAsync = Sinon.stub().returns(Promise.resolve(account))
      setupAccountsDb({ findOneAsync: findOneAsync })
      Model.getByName(name)
        .then(r => {
          assert.equal(r, account)
          assert.equal(findOneAsync.firstCall.args[0].name, name)
          assert.end()
        })
        .catch(err => {
          assert.fail(err)
        })
    })

    getByName.end()
  })

  modelTest.test('create should', function (createTest) {
    createTest.test('save payload as new object', function (assert) {
      let saveAsync = Sinon.stub()
      setupAccountsDb({ saveAsync: saveAsync })
      let payload = { name: 'dfsp1' }
      Model.create(payload)
        .then(() => {
          let saveAsyncArg = saveAsync.firstCall.args[0]
          assert.notEqual(saveAsyncArg, payload)
          assert.equal(saveAsyncArg.name, payload.name)
          assert.end()
        })
    })

    createTest.test('return newly created account', function (t) {
      let newAccount = { accountId: 1 }
      let saveAsync = Sinon.stub().returns(newAccount)
      setupAccountsDb({ saveAsync: saveAsync })
      Model.create({})
        .then(s => {
          t.equal(s, newAccount)
          t.end()
        })
        .catch(err => {
          t.fail(err)
        })
    })

    createTest.end()
  })

  modelTest.end()
})
