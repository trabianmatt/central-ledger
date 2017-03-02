'use strict'

const src = '../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Model = require(`${src}/models/settled-transfers`)
const Db = require(`${src}/db`)

Test('settled-transfers model', function (modelTest) {
  let sandbox
  let settledTransfersStubs

  let settledTransfersTable = 'settledTransfers'

  modelTest.beforeEach((t) => {
    sandbox = Sinon.sandbox.create()

    settledTransfersStubs = {
      insert: sandbox.stub(),
      truncate: sandbox.stub()
    }

    Db.connection = sandbox.stub()
    Db.connection.withArgs(settledTransfersTable).returns(settledTransfersStubs)

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

      settledTransfersStubs.insert.withArgs({ transferId: transfer.id, settlementId: transfer.settlementId }).returns(P.resolve([created]))

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
      settledTransfersStubs.truncate.returns(P.resolve())

      Model.truncate()
        .then(() => {
          test.ok(settledTransfersStubs.truncate.calledOnce)
          test.end()
        })
    })

    truncateTest.end()
  })

  modelTest.end()
})
