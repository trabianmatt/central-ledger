'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Model = require(`${src}/domain/account/model`)
const Db = require(`${src}/db`)

Test('accounts model', modelTest => {
  let sandbox
  let dbConnection
  let dbMethodsStub

  const accountsTable = 'accounts'
  const userCredentialsTable = 'userCredentials'

  let setupDatabaseForTable = (tableName, methodStubs = dbMethodsStub) => {
    dbConnection.withArgs(tableName).returns(methodStubs)
  }

  modelTest.beforeEach((t) => {
    sandbox = Sinon.sandbox.create()
    dbMethodsStub = {
      insert: sandbox.stub(),
      update: sandbox.stub(),
      where: sandbox.stub(),
      orderBy: sandbox.stub()
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

  modelTest.test('getAll should', getAllTest => {
    getAllTest.test('return exception if db.connect throws', test => {
      const error = new Error()
      Db.connect.returns(P.reject(error))

      Model.getAll()
        .then(() => {
          test.fail('Should have thrown error')
        })
        .catch(err => {
          test.equal(err, error)
          test.end()
        })
    })

    getAllTest.test('return exception if db query throws', test => {
      const error = new Error()

      dbMethodsStub.orderBy.withArgs('name', 'asc').returns(P.reject(error))
      setupDatabaseForTable(accountsTable)

      Model.getAll()
        .then(() => {
          test.fail('Should have thrown error')
        })
        .catch(err => {
          test.equal(err, error)
          test.end()
        })
    })

    getAllTest.test('return all accounts ordered by name', test => {
      const account1Name = 'dfsp1'
      const account2Name = 'dfsp2'
      const accounts = [{ name: account1Name }, { name: account2Name }]

      dbMethodsStub.orderBy.withArgs('name', 'asc').returns(P.resolve(accounts))
      setupDatabaseForTable(accountsTable)

      Model.getAll()
        .then((found) => {
          test.equal(found, accounts)
          test.end()
        })
        .catch(err => {
          test.fail(err)
        })
    })

    getAllTest.end()
  })

  modelTest.test('getById should', getByIdTest => {
    getByIdTest.test('return exception if db.connect throws', test => {
      const error = new Error()
      Db.connect.returns(P.reject(error))

      Model.getById(1)
        .then(() => {
          test.fail('Should have thrown error')
        })
        .catch(err => {
          test.equal(err, error)
          test.end()
        })
    })

    getByIdTest.test('return exception if db query throws', test => {
      const error = new Error()

      dbMethodsStub.where.withArgs({ accountId: 1 }).returns({ first: sandbox.stub().returns(P.reject(error)) })
      setupDatabaseForTable(accountsTable)

      Model.getById(1)
        .then(() => {
          test.fail('Should have thrown error')
        })
        .catch(err => {
          test.equal(err, error)
          test.end()
        })
    })

    getByIdTest.test('finds account by id', test => {
      const id = 1
      const account = { accountId: id }

      dbMethodsStub.where.withArgs({ accountId: id }).returns({ first: sandbox.stub().returns(P.resolve(account)) })
      setupDatabaseForTable(accountsTable)

      Model.getById(id)
        .then(r => {
          test.equal(r, account)
          test.equal(dbMethodsStub.where.firstCall.args[0].accountId, id)
          test.end()
        })
        .catch(err => {
          test.fail(err)
        })
    })

    getByIdTest.end()
  })

  modelTest.test('getByName should', getByNameTest => {
    getByNameTest.test('return exception if db.connect throws', test => {
      let error = new Error()
      Db.connect.returns(P.reject(error))

      Model.getByName('dfsp1')
        .then(() => {
          test.fail('Should have thrown error')
        })
        .catch(err => {
          test.equal(err, error)
          test.end()
        })
    })

    getByNameTest.test('return exception if db query throws', test => {
      let name = 'dfsp1'
      let error = new Error()

      dbMethodsStub.where.withArgs({ name: name }).returns({ first: sandbox.stub().returns(P.reject(error)) })
      setupDatabaseForTable(accountsTable)

      Model.getByName(name)
        .then(() => {
          test.fail('Should have thrown error')
        })
        .catch(err => {
          test.equal(err, error)
          test.end()
        })
    })

    getByNameTest.test('finds account by name', test => {
      let name = 'dfsp1'
      let account = { name: name }

      dbMethodsStub.where.withArgs({ name: name }).returns({ first: sandbox.stub().returns(P.resolve(account)) })
      setupDatabaseForTable(accountsTable)

      Model.getByName(name)
        .then(r => {
          test.equal(r, account)
          test.equal(dbMethodsStub.where.firstCall.args[0].name, name)
          test.end()
        })
        .catch(err => {
          test.fail(err)
        })
    })

    getByNameTest.end()
  })

  modelTest.test('update should', updateTest => {
    updateTest.test('return exception if db.connect throws', test => {
      let error = new Error()
      const id = 1
      const account = { accountId: id }
      const isDisabled = false
      Db.connect.returns(P.reject(error))

      Model.update(account, isDisabled)
        .then(() => {
          test.fail('Should have thrown error')
        })
        .catch(err => {
          test.equal(err, error)
          test.end()
        })
    })

    updateTest.test('return exception if db query throws', test => {
      let error = new Error()
      const id = 1
      const account = { accountId: id }
      const isDisabled = false

      let updateStub = sandbox.stub().returns(P.reject(error))
      dbMethodsStub.where.withArgs({ accountId: id }).returns({ update: updateStub })
      setupDatabaseForTable(accountsTable)

      Model.update(account, isDisabled)
        .then(() => {
          test.fail('Should have thrown error')
        })
        .catch(err => {
          test.ok(updateStub.withArgs({ isDisabled: isDisabled }, '*').calledOnce)
          test.equal(err, error)
          test.end()
        })
    })

    updateTest.test('update an account', test => {
      let name = 'dfsp1'
      const isDisabled = true
      const id = 1

      let account = {
        accountId: id,
        name: name,
        isDisabled: false
      }

      let updatedAccount = {
        accountId: id,
        name: name,
        isDisabled: isDisabled
      }

      let updateStub = sandbox.stub().returns(P.resolve([updatedAccount]))

      dbMethodsStub.where.withArgs({ accountId: id }).returns({ update: updateStub })
      setupDatabaseForTable(accountsTable)

      Model.update(account, isDisabled)
        .then(r => {
          test.ok(updateStub.withArgs({ isDisabled: isDisabled }, '*').calledOnce)
          test.equal(r, updatedAccount)
          test.end()
        })
        .catch(err => {
          test.fail(err)
        })
    })

    updateTest.end()
  })

  modelTest.test('create should', createTest => {
    createTest.test('save payload and return new account', test => {
      let name = 'dfsp1'
      let payload = { name: name, hashedPassword: 'hashedPassword' }
      let insertedAccount = { accountId: 1, name: name }

      let insertAccountStub = sandbox.stub().returns(P.resolve([insertedAccount]))
      setupDatabaseForTable(accountsTable, { insert: insertAccountStub })

      let insertUserCredsStub = sandbox.stub().returns(P.resolve([]))
      setupDatabaseForTable(userCredentialsTable, { insert: insertUserCredsStub })

      Model.create(payload)
        .then(s => {
          test.comment(JSON.stringify(insertAccountStub.firstCall.args))
          test.ok(insertAccountStub.withArgs({ name: name }, '*').calledOnce)
          test.ok(insertUserCredsStub.withArgs({ accountId: insertedAccount.accountId, password: payload.hashedPassword }, '*').calledOnce)
          test.equal(s, insertedAccount)
          test.end()
        })
    })

    createTest.end()
  })

  modelTest.test('retrieveUserCredentials should', retrieverUserCredsTest => {
    retrieverUserCredsTest.test('return user credentials for a given account', test => {
      let account = { name: 'dfsp1', 'accountId': '1234' }
      let userCredentials = { accountId: account.accountId, password: 'password' }

      dbMethodsStub.where.withArgs({ accountId: account.accountId }).returns({ first: sandbox.stub().returns(P.resolve(userCredentials)) })
      setupDatabaseForTable(userCredentialsTable)

      Model.retrieveUserCredentials(account)
        .then(r => {
          let whereArg = dbMethodsStub.where.firstCall.args[0]
          test.equal(whereArg.accountId, account.accountId)
          test.equal(r.accountId, userCredentials.accountId)
          test.equal(r.password, userCredentials.password)
          test.end()
        })
    })

    retrieverUserCredsTest.end()
  })

  modelTest.end()
})
