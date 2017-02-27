'use strict'

const src = '../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Model = require(`${src}/models/settled-transfers`)
const Db = require(`${src}/db`)

Test('settled-transfers model', function (modelTest) {
  let sandbox
  let dbConnection
  let dbMethodsStub

  let settledTransfersTable = 'settledTransfers'

  let setupDatabase = (methodStubs = dbMethodsStub) => {
    dbConnection.withArgs(settledTransfersTable).returns(methodStubs)
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
    createTest.test('insert new record', test => {
      let transfer = { id: '1234', settlementId: 'abc' }
      let created = { transferId: transfer.id, settlementId: transfer.settlementId }

      dbMethodsStub.insert.withArgs({ transferId: transfer.id, settlementId: transfer.settlementId }).returns(P.resolve([created]))
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
