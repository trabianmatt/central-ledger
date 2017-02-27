'use strict'

const src = '../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Model = require(`${src}/models/executed-transfers`)
const Db = require(`${src}/db`)

Test('executed-transfers model', function (modelTest) {
  let sandbox
  let dbConnection
  let dbMethodsStub

  const executedTransfersTable = 'executedTransfers'

  let setupDatabase = (methodStubs = dbMethodsStub) => {
    dbConnection.withArgs(executedTransfersTable).returns(methodStubs)
  }

  modelTest.beforeEach((t) => {
    sandbox = Sinon.sandbox.create()
    dbMethodsStub = {
      insert: sandbox.stub(),
      truncate: sandbox.stub()
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
    createTest.test('insert and return new record', test => {
      let transfer = { id: '1234' }
      let created = { transferId: transfer.id }

      dbMethodsStub.insert.withArgs({ transferId: transfer.id }).returns(P.resolve([created]))
      setupDatabase()

      Model.create(transfer)
        .then(c => {
          test.equal(c, created)
          test.end()
        })
    })

    createTest.end()
  })

  modelTest.test('truncate should', truncateTest => {
    truncateTest.test('truncate table', test => {
      dbMethodsStub.truncate.returns(P.resolve())
      setupDatabase()

      Model.truncate()
        .then(() => {
          test.ok(dbMethodsStub.truncate.calledOnce)
          test.end()
        })
    })

    truncateTest.end()
  })

  modelTest.end()
})
