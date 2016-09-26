'use strict'

const Test = require('tape')
const Proxyquire = require('proxyquire')
const Sinon = require('sinon')

function createModel (db) {
  return Proxyquire('../../../../src/api/accounts/model', {
    '../../lib/db': db
  })
}

function setupAccountsDb (accounts) {
  var db = { accounts: accounts }
  return {
    connect: () => Promise.resolve(db)
  }
}

Test('accounts model', function (modelTest) {
  modelTest.test('getByName should', function (getByName) {
    getByName.test('return exception if db.connect throws', function (assert) {
      let error = new Error()
      let db = { connect: () => Promise.reject(error) }
      var model = createModel(db)

      model.getByName('dfsp1')
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
      let db = setupAccountsDb({ findOneAsync: findOneAsync })
      let model = createModel(db)

      model.getByName('dfsp1')
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
      let model = createModel(setupAccountsDb({ findOneAsync: findOneAsync }))

      model.getByName(name)
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
      let model = createModel(setupAccountsDb({ saveAsync: saveAsync }))
      let payload = { name: 'dfsp1' }
      model.create(payload)
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
      let model = createModel(setupAccountsDb({ saveAsync: saveAsync }))
      model.create({})
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
