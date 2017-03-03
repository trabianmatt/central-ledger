'use strict'

const src = '../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Model = require(`${src}/models/executed-transfers`)
const Db = require(`${src}/db`)

Test('executed-transfers model', function (modelTest) {
  let sandbox
  let executedTransfersStubs

  modelTest.beforeEach((t) => {
    sandbox = Sinon.sandbox.create()

    executedTransfersStubs = {
      insert: sandbox.stub(),
      truncate: sandbox.stub()
    }

    Db.executedTransfers = sandbox.stub().returns(executedTransfersStubs)

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

      executedTransfersStubs.insert.withArgs({ transferId: transfer.id }).returns(P.resolve([created]))

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
      executedTransfersStubs.truncate.returns(P.resolve())

      Model.truncate()
        .then(() => {
          test.ok(executedTransfersStubs.truncate.calledOnce)
          test.end()
        })
    })

    truncateTest.end()
  })

  modelTest.end()
})
