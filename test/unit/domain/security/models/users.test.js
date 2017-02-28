'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Uuid = require('uuid4')
const Db = require('../../../../../src/db')
const Model = require('../../../../../src/domain/security/models/users')

Test('Users model', modelTest => {
  let sandbox
  let dbConnection
  let dbMethodsStub

  const usersTable = 'users'

  modelTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    dbMethodsStub = {
      insert: sandbox.stub(),
      where: sandbox.stub(),
      select: sandbox.stub()
    }
    sandbox.stub(Db, 'connect')
    dbConnection = sandbox.stub()
    dbConnection.withArgs(usersTable).returns(dbMethodsStub)
    Db.connect.returns(P.resolve(dbConnection))
    test.end()
  })

  modelTest.afterEach(test => {
    sandbox.restore()
    test.end()
  })

  modelTest.test('getAll should', getAllTest => {
    getAllTest.test('find all users in db', test => {
      const users = [{}, {}]
      dbMethodsStub.select.returns(P.resolve(users))

      Model.getAll()
        .then(result => {
          test.deepEqual(result, users)
          test.end()
        })
    })

    getAllTest.end()
  })

  modelTest.test('getById should', getByIdTest => {
    getByIdTest.test('select first user by id', test => {
      const userId = Uuid()
      const user = { firstName: 'Dave' }
      dbMethodsStub.where.withArgs({ userId }).returns({ first: sandbox.stub().returns(P.resolve(user)) })

      Model.getById(userId)
        .then(result => {
          test.equal(result, user)
          test.end()
        })
    })

    getByIdTest.end()
  })

  modelTest.test('remove should', removeTest => {
    removeTest.test('destroy user in db', test => {
      const userId = Uuid()

      dbMethodsStub.where.withArgs({ userId }).returns({ del: sandbox.stub().returns(P.resolve(1)) })

      Model.remove(userId)
        .then(result => {
          test.equal(result, 1)
          test.end()
        })
    })

    removeTest.end()
  })

  modelTest.test('save should', saveTest => {
    saveTest.test('insert user in db if userId not defined', test => {
      const user = { firstName: 'Dave' }
      dbMethodsStub.insert.withArgs(sandbox.match(user), '*').returns(P.resolve([user]))

      Model.save(user)
        .then(result => {
          test.deepEqual(result, user)
          test.end()
        })
    })

    saveTest.test('update user in db if userId defined', test => {
      const userId = Uuid()
      const user = { userId }

      const updateStub = sandbox.stub().returns(P.resolve([user]))
      dbMethodsStub.where.withArgs(user).returns({ update: updateStub })

      Model.save(user)
        .then(result => {
          test.ok(updateStub.calledWith(user, '*'))
          test.deepEqual(result, user)
          test.end()
        })
    })
    saveTest.end()
  })

  modelTest.end()
})

