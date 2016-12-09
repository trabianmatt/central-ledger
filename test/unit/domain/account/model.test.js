'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Model = require(`${src}/domain/account/model`)
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

  modelTest.test('getAll should', function (getAllTest) {
    getAllTest.test('return exception if db.connect throws', function (assert) {
      const error = new Error()
      sandbox.stub(Db, 'connect').returns(Promise.reject(error))

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
      const findAsync = function () { return Promise.reject(error) }
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

      const findAsync = Sinon.stub().returns(Promise.resolve(accounts))
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
      sandbox.stub(Db, 'connect').returns(Promise.reject(error))

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
      const findOneAsync = function () { return Promise.reject(error) }
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
      const findOneAsync = Sinon.stub().returns(Promise.resolve(account))
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

  modelTest.test('getByKey should', getByKeyTest => {
    getByKeyTest.test('return exception if db.connect throws', function (assert) {
      const error = new Error()
      sandbox.stub(Db, 'connect').returns(Promise.reject(error))

      Model.getByKey(1)
        .then(() => {
          assert.fail('Should have thrown error')
        })
        .catch(err => {
          assert.equal(err, error)
          assert.end()
        })
    })

    getByKeyTest.test('return exception if db.findOneAsync throws', function (assert) {
      const error = new Error()
      const findOneAsync = function () { return Promise.reject(error) }
      setupAccountsDb({ findOneAsync: findOneAsync })

      Model.getByKey(1)
        .then(() => {
          assert.fail('Should have thrown error')
        })
        .catch(err => {
          assert.equal(err, error)
          assert.end()
        })
    })

    getByKeyTest.test('finds account by key', function (assert) {
      const id = 1
      const key = 'some-key'
      const account = { accountId: id, key }
      const findOneAsync = Sinon.stub().returns(Promise.resolve(account))
      setupAccountsDb({ findOneAsync: findOneAsync })

      Model.getByKey(key)
        .then(r => {
          assert.equal(r, account)
          assert.equal(findOneAsync.firstCall.args[0].key, key)
          assert.end()
        })
        .catch(err => {
          assert.fail(err)
        })
    })

    getByKeyTest.end()
  })

  modelTest.test('getByName should', function (getByNameTest) {
    getByNameTest.test('return exception if db.connect throws', function (assert) {
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

    getByNameTest.test('return exception if db.findOneAsync throws', function (assert) {
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

    getByNameTest.test('finds account by name', function (assert) {
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

    getByNameTest.end()
  })

  modelTest.test('create should', function (createTest) {
    createTest.test('save payload as new object', function (assert) {
      let saveAsync = Sinon.stub()
      setupAccountsDb({ saveAsync: saveAsync })
      let payload = { name: 'dfsp1', key: 'key', secret: 'secret' }

      Model.create(payload)
        .then(() => {
          let saveAsyncArg = saveAsync.firstCall.args[0]
          assert.notEqual(saveAsyncArg, payload)
          assert.equal(saveAsyncArg.name, payload.name)
          assert.equal(saveAsyncArg.key, payload.key)
          assert.equal(saveAsyncArg.secret, payload.secret)
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
