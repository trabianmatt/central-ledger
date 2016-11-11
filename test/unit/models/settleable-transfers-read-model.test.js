'use strict'

const src = '../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Model = require(`${src}/models/settleable-transfers-read-model`)
const Db = require(`${src}/db`)

Test('settleable-transfers-read-model', function (modelTest) {
  let sandbox

  modelTest.beforeEach((t) => {
    sandbox = Sinon.sandbox.create()
    t.end()
  })

  modelTest.afterEach((t) => {
    sandbox.restore()
    t.end()
  })

  modelTest.test('getSettleableTransfers should', function (getSettleableTransfersTest) {
    getSettleableTransfersTest.test('invoke getSettleableTransfersAsync on db', function (assert) {
      let getSettleableTransfersAsync = sandbox.stub().returns(Promise.resolve())
      sandbox.stub(Db, 'connect').returns(Promise.resolve({ getSettleableTransfersAsync: getSettleableTransfersAsync }))

      Model.getSettleableTransfers()
        .then(() => {
          assert.ok(getSettleableTransfersAsync.calledOnce)
          assert.end()
        }
        )
    })

    getSettleableTransfersTest.end()
  })

  modelTest.test('getSettleableTransfersByAccount should', function (getSettleableTransfersByAccountTest) {
    getSettleableTransfersByAccountTest.test('invoke getSettleableTransfersAsync on db', function (assert) {
      let getSettleableTransfersByAccountAsync = sandbox.stub().returns(Promise.resolve())
      sandbox.stub(Db, 'connect').returns(Promise.resolve({ getSettleableTransfersByAccountAsync: getSettleableTransfersByAccountAsync }))

      let accountId = 1
      Model.getSettleableTransfersByAccount(accountId)
        .then(() => {
          assert.ok(getSettleableTransfersByAccountAsync.calledOnce)
          assert.ok(getSettleableTransfersByAccountAsync.calledWith(accountId))
          assert.end()
        }
        )
    })

    getSettleableTransfersByAccountTest.end()
  })

  modelTest.end()
})
