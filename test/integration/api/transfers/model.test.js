'use strict'

const src = '../../../../src'
const Test = require('tape')
const Moment = require('moment')
const Db = require(src + '/lib/db')
const Model = require(src + '/api/transfers/model')
const TransfersReadModel = require(src + '/models/transfers-read-model')

let transferPreparedEvent = {
  id: 1,
  name: 'TransferPrepared',
  payload: {
    ledger: 'http://central-ledger.example',
    debits: [{
      account: 'http://central-ledger.example/accounts/dfsp1',
      amount: '50'
    }],
    credits: [{
      account: 'http://central-ledger.example/accounts/dfsp2',
      amount: '50'
    }],
    execution_condition: 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2',
    expires_at: '2015-06-16T00:00:01.000Z'
  },
  aggregate: {
    id: '1d4f2a70-e0d6-42dc-9efb-6d23060ccd6f',
    name: 'Transfer'
  },
  context: 'Ledger',
  timestamp: 1474471273588
}

let transferExecutedEvent = {
  id: 2,
  name: 'TransferExecuted',
  payload: {
    ledger: 'http://central-ledger.example',
    debits: [{
      account: 'http://central-ledger.example/accounts/dfsp1',
      amount: '50'
    }],
    credits: [{
      account: 'http://central-ledger.example/accounts/dfsp2',
      amount: '50'
    }],
    execution_condition: 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2',
    expires_at: '2015-06-16T00:00:01.000Z',
    fulfillment: 'cf:0:_v8'
  },
  aggregate: {
    id: '1d4f2a70-e0d6-42dc-9efb-6d23060ccd6f',
    name: 'Transfer'
  },
  context: 'Ledger',
  timestamp: 1474471284081
}

Test('transfer model', function (modelTest) {
  modelTest.test('prepare should', function (prepareTest) {
    let transfer = {
      id: 'http://central-ledger.example/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204',
      ledger: 'http://central-ledger.example',
      debits: [{
        account: 'http://central-ledger.example/accounts/dfsp1',
        amount: '50'
      }],
      credits: [{
        account: 'http://central-ledger.example/accounts/dfsp2',
        amount: '50'
      }],
      execution_condition: 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2',
      expires_at: '2015-06-16T00:00:01.000Z'
    }

    prepareTest.test('prepare a transfer', function (assert) {
      Model.prepare(transfer)
        .then((prepared) => {
          assert.equal(prepared.id, transfer.id)
          assert.equal(prepared.ledger, transfer.ledger)
          assert.equal(prepared.debits[0].account, transfer.debits[0].account)
          assert.equal(prepared.debits[0].amount, transfer.debits[0].amount)
          assert.equal(prepared.credits[0].account, transfer.credits[0].account)
          assert.equal(prepared.credits[0].amount, transfer.credits[0].amount)
          assert.equal(prepared.execution_condition, transfer.execution_condition)
          assert.equal(prepared.expires_at, transfer.expires_at)
          assert.end()
        })
    })

    prepareTest.end()
  })

  modelTest.test('fulfill should', function (fulfillTest) {
    let fulfillment = {
      id: '3a2a1d9e-8640-4d2d-b06c-84f2cd613204',
      fulfillment: 'cf:0:_v8'
    }

    fulfillTest.test('fulfill a transfer', function (assert) {
      Model.fulfill(fulfillment)
        .then((fulfilled) => {
          assert.equal(fulfilled, fulfillment.fulfillment)
          assert.end()
        })
    })

    fulfillTest.end()
  })

  modelTest.test('saveTransferPrepared should', function (transferPreparedTest) {
    transferPreparedTest.test('save a TransferPrepared event object to the read model', function (assert) {
      TransfersReadModel.saveTransferPrepared(transferPreparedEvent)
        .then((transfer) => {
          assert.equal(transfer.transferUuid, transferPreparedEvent.aggregate.id)
          assert.equal(transfer.state, 'prepared')
          assert.equal(transfer.ledger, transferPreparedEvent.payload.ledger)
          assert.equal(transfer.debitAccount, transferPreparedEvent.payload.debits[0].account)
          assert.equal(transfer.debitAmount, parseFloat(transferPreparedEvent.payload.debits[0].amount).toFixed(2))
          assert.notOk(transfer.debitMemo)
          assert.notOk(transfer.debitInvoice)
          assert.equal(transfer.creditAccount, transferPreparedEvent.payload.credits[0].account)
          assert.equal(transfer.creditAmount, parseFloat(transferPreparedEvent.payload.credits[0].amount).toFixed(2))
          assert.notOk(transfer.creditMemo)
          assert.notOk(transfer.creditInvoice)
          assert.equal(transfer.executionCondition, transferPreparedEvent.payload.execution_condition)
          assert.notOk(transfer.cancellationCondition)
          assert.notOk(transfer.rejectReason)
          assert.deepEqual(transfer.expiresAt, Moment(transferPreparedEvent.payload.expires_at).toDate())
          assert.notOk(transfer.additionalInfo)
          assert.deepEqual(transfer.preparedDate, Moment(transferPreparedEvent.timestamp).toDate())
          assert.end()
        })
    })

    transferPreparedTest.end()
  })

  modelTest.test('saveTransferExecuted should', function (transferExecutedTest) {
    transferExecutedTest.test('update the read model with TransferExecuted event object', function (assert) {
      TransfersReadModel.saveTransferExecuted(transferExecutedEvent)
        .then((transfer) => {
          assert.equal(transfer.transferUuid, transferExecutedEvent.aggregate.id)
          assert.equal(transfer.state, 'executed')
          assert.equal(transfer.fulfillment, transferExecutedEvent.payload.fulfillment)
          assert.deepEqual(transfer.executedDate, Moment(transferExecutedEvent.timestamp).toDate())
          assert.end()
        })
    })

    transferExecutedTest.end()
  })

  modelTest.test('truncateReadModel should', function (truncateTest) {
    truncateTest.test('delete all records from transfers read model', function (assert) {
      Db.connect().then(db => db.transfers.countAsync())
        .then(count => {
          assert.ok(parseInt(count) > 0)
          TransfersReadModel.truncateReadModel()
            .then(() => {
              Db.connect()
                .then(db => {
                  db.transfers.countAsync()
                    .then(count => {
                      assert.equal(parseInt(count), 0)
                      assert.end()
                    })
                })
            })
        })
    })

    truncateTest.end()
  })

  modelTest.test('getById should', function (getByIdTest) {
    getByIdTest.test('retrieve transfer from read model by id', function (assert) {
      TransfersReadModel.saveTransferPrepared(transferPreparedEvent)
        .then((saved) => {
          TransfersReadModel.getById(saved.transferUuid)
            .then((found) => {
              assert.notEqual(found, saved)
              assert.deepEqual(found, saved)
              assert.end()
            })
        })
    })

    getByIdTest.end()
  })

  modelTest.end()
})
