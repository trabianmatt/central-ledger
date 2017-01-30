'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Model = require(`${src}/domain/account/model`)
const Db = require(`${src}/db`)

Test('accounts model', function (modelTest) {
  let sandbox

  function setupAccountsDb (accounts, userCredentials = {}) {
    sandbox.stub(Db, 'connect').returns(P.resolve({ accounts: accounts, userCredentials: userCredentials }))
  }

  modelTest.beforeEach((t) => {
    sandbox = Sinon.sandbox.create()
    t.end()
  })

  modelTest.afterEach((t) => {
    sandbox.restore()
    t.end()
  })

  modelTest.test('getAll should', function (getAllTest) {
    getAllTest.test('return exception if db.connect throws', function (assert) {
      const error = new Error()
      sandbox.stub(Db, 'connect').returns(P.reject(error))

      Model.getAll()
        .then(() => {
          assert.fail('Should have thrown error')
        })
        .catch(err => {
          assert.equal(err, error)
          assert.end()
        })
    })

    getAllTest.test('return exception if db.findAsync throws', function (assert) {
      const error = new Error()
      const findAsync = function () { return P.reject(error) }
      setupAccountsDb({ findAsync: findAsync })

      Model.getAll()
        .then(() => {
          assert.fail('Should have thrown error')
        })
        .catch(err => {
          assert.equal(err, error)
          assert.end()
        })
    })

    getAllTest.test('return all accounts ordered by name', function (assert) {
      const account1Name = 'dfsp1'
      const account2Name = 'dfsp2'
      const accounts = [{ name: account1Name }, { name: account2Name }]

      const findAsync = Sinon.stub().returns(P.resolve(accounts))
      setupAccountsDb({ findAsync: findAsync })

      Model.getAll()
        .then((found) => {
          assert.equal(found, accounts)
          assert.deepEqual(findAsync.firstCall.args[0], {})
          assert.equal(findAsync.firstCall.args[1].order, 'name')
          assert.end()
        })
        .catch(err => {
          assert.fail(err)
        })
    })

    getAllTest.end()
  })

  modelTest.test('getById should', function (getByIdTest) {
    getByIdTest.test('return exception if db.connect throws', function (assert) {
      const error = new Error()
      sandbox.stub(Db, 'connect').returns(P.reject(error))

      Model.getById(1)
        .then(() => {
          assert.fail('Should have thrown error')
        })
        .catch(err => {
          assert.equal(err, error)
          assert.end()
        })
    })

    getByIdTest.test('return exception if db.findOneAsync throws', function (assert) {
      const error = new Error()
      const findOneAsync = function () { return P.reject(error) }
      setupAccountsDb({ findOneAsync: findOneAsync })

      Model.getById(1)
        .then(() => {
          assert.fail('Should have thrown error')
        })
        .catch(err => {
          assert.equal(err, error)
          assert.end()
        })
    })

    getByIdTest.test('finds account by id', function (assert) {
      const id = 1
      const account = { accountId: id }
      const findOneAsync = Sinon.stub().returns(P.resolve(account))
      setupAccountsDb({ findOneAsync: findOneAsync })

      Model.getById(id)
        .then(r => {
          assert.equal(r, account)
          assert.equal(findOneAsync.firstCall.args[0].accountId, id)
          assert.end()
        })
        .catch(err => {
          assert.fail(err)
        })
    })

    getByIdTest.end()
  })

  modelTest.test('getByName should', function (getByNameTest) {
    getByNameTest.test('return exception if db.connect throws', function (assert) {
      let error = new Error()
      sandbox.stub(Db, 'connect').returns(P.reject(error))

      Model.getByName('dfsp1')
        .then(() => {
          assert.fail('Should have thrown error')
        })
        .catch(err => {
          assert.equal(err, error)
          assert.end()
        })
    })

    getByNameTest.test('return exception if db.findOneAsync throws', function (assert) {
      let error = new Error()
      let findOneAsync = function () { return P.reject(error) }
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

    getByNameTest.test('finds account by name', function (assert) {
      let name = 'dfsp1'
      let account = { name: name }
      let findOneAsync = Sinon.stub().returns(P.resolve(account))
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

    getByNameTest.end()
  })

  modelTest.test('create should', function (createTest) {
    createTest.test('save payload as new object', function (assert) {
      let name = 'dfsp1'
      let account = { name: name }
      let saveAsyncAccount = Sinon.stub().returns(P.resolve(account))
      let saveAsyncUserCredentials = Sinon.stub().returns(P.resolve({}))
      setupAccountsDb({ saveAsync: saveAsyncAccount }, { saveAsync: saveAsyncUserCredentials })

      let payload = { name: 'dfsp1', hashedPassword: 'hashedPassword' }

      Model.create(payload)
        .then(() => {
          let saveAsyncArg = saveAsyncAccount.firstCall.args[0]
          assert.notEqual(saveAsyncArg, payload)
          assert.equal(saveAsyncArg.name, payload.name)
          assert.end()
        })
    })

    createTest.test('return newly created account', function (t) {
      let name = 'dfsp1'
      let account = { name: name, accountId: 1 }
      let saveAsyncAccount = Sinon.stub().returns(P.resolve(account))
      let saveAsyncUserCredentials = Sinon.stub().returns(P.resolve({}))
      setupAccountsDb({ saveAsync: saveAsyncAccount }, { saveAsync: saveAsyncUserCredentials })

      Model.create({})
        .then(s => {
          t.equal(s, account)
          t.end()
        })
        .catch(err => {
          t.fail(err)
        })
    })

    createTest.end()
  })

  modelTest.test('retrieveUserCredentials should', function (createTest) {
    createTest.test('return user credentials for a given account', function (assert) {
      let name = 'dfsp1'
      let accountId = '1234'
      let password = 'password'
      let account = { name: name, accountId: accountId }
      let userCredentials = { accountId: accountId, password: password }

      const findOneAsync = Sinon.stub().returns(P.resolve(userCredentials))
      setupAccountsDb({}, { findOneAsync: findOneAsync })

      Model.retrieveUserCredentials(account)
        .then(r => {
          let findOneAsyncArg = findOneAsync.firstCall.args[0]
          assert.equal(findOneAsyncArg.accountId, account.accountId)
          assert.equal(r.accountId, userCredentials.accountId)
          assert.equal(r.password, userCredentials.password)
          assert.end()
        })
    })

    createTest.end()
  })

  modelTest.end()
})
