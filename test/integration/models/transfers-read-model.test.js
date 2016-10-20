'use strict'

const src = '../../../src'
const Test = require('tape')
const Moment = require('moment')
const Db = require(`${src}/lib/db`)
const TransfersReadModel = require(`${src}/models/transfers-read-model`)
const Fixtures = require('../../fixtures')

let pastDate = () => {
  let d = new Date()
  d.setDate(d.getDate() - 5)
  return d
}

Test('transfers read model', function (modelTest) {
  modelTest.test('saveTransferPrepared should', function (transferPreparedTest) {
    transferPreparedTest.test('save a TransferPrepared event object to the read model', function (assert) {
      let transferId = Fixtures.generateTransferId()
      let event = Fixtures.buildTransferPreparedEvent(transferId, Fixtures.buildDebitOrCredit(Fixtures.generateAccountName(), '50'), Fixtures.buildDebitOrCredit(Fixtures.generateAccountName(), '50'))

      TransfersReadModel.saveTransferPrepared(event)
        .then((transfer) => {
          assert.equal(transfer.transferUuid, event.aggregate.id)
          assert.equal(transfer.state, 'prepared')
          assert.equal(transfer.ledger, event.payload.ledger)
          assert.equal(transfer.debitAccount, event.payload.debits[0].account)
          assert.equal(transfer.debitAmount, parseFloat(event.payload.debits[0].amount).toFixed(2))
          assert.notOk(transfer.debitMemo)
          assert.notOk(transfer.debitInvoice)
          assert.equal(transfer.creditAccount, event.payload.credits[0].account)
          assert.equal(transfer.creditAmount, parseFloat(event.payload.credits[0].amount).toFixed(2))
          assert.notOk(transfer.creditMemo)
          assert.notOk(transfer.creditInvoice)
          assert.equal(transfer.executionCondition, event.payload.execution_condition)
          assert.notOk(transfer.cancellationCondition)
          assert.notOk(transfer.rejectReason)
          assert.deepEqual(transfer.expiresAt, Moment(event.payload.expires_at).toDate())
          assert.notOk(transfer.additionalInfo)
          assert.deepEqual(transfer.preparedDate, Moment(event.timestamp).toDate())
          assert.end()
        })
    })

    transferPreparedTest.end()
  })

  modelTest.test('saveTransferExecuted should', function (transferExecutedTest) {
    transferExecutedTest.test('update the read model with TransferExecuted event object', function (assert) {
      let transferId = Fixtures.generateTransferId()
      let debit = Fixtures.buildDebitOrCredit(Fixtures.generateAccountName(), '50')
      let credit = Fixtures.buildDebitOrCredit(Fixtures.generateAccountName(), '50')
      let preparedEvent = Fixtures.buildTransferPreparedEvent(transferId, debit, credit)

      TransfersReadModel.saveTransferPrepared(preparedEvent)
        .then(() => {
          let executedEvent = Fixtures.buildTransferExecutedEvent(transferId, debit, credit)
          return TransfersReadModel.saveTransferExecuted(executedEvent)
            .then((transfer) => {
              assert.equal(transfer.transferUuid, executedEvent.aggregate.id)
              assert.equal(transfer.state, 'executed')
              assert.equal(transfer.fulfillment, executedEvent.payload.fulfillment)
              assert.deepEqual(transfer.executedDate, Moment(executedEvent.timestamp).toDate())
              assert.end()
            })
        })
    })

    transferExecutedTest.end()
  })

  modelTest.test('saveTransferRejected should', function (transferRejectedTest) {
    transferRejectedTest.test('update the read model with TransferRejected event object', function (assert) {
      let transferId = Fixtures.generateTransferId()
      let debit = Fixtures.buildDebitOrCredit(Fixtures.generateAccountName(), '50')
      let credit = Fixtures.buildDebitOrCredit(Fixtures.generateAccountName(), '50')
      let preparedEvent = Fixtures.buildTransferPreparedEvent(transferId, debit, credit)

      TransfersReadModel.saveTransferPrepared(preparedEvent)
        .then(() => {
          let rejectedEvent = Fixtures.buildTransferRejectedEvent(transferId, 'terrible transfer')
          return TransfersReadModel.saveTransferRejected(rejectedEvent)
            .then((transfer) => {
              assert.equal(transfer.transferUuid, rejectedEvent.aggregate.id)
              assert.equal(transfer.state, 'rejected')
              assert.equal(transfer.rejectionReason, 'cancelled')
              assert.equal(transfer.creditRejected, 1)
              assert.equal(transfer.creditRejectionMessage, rejectedEvent.payload.rejection_reason)
              assert.deepEqual(transfer.rejectedDate, Moment(rejectedEvent.timestamp).toDate())
              assert.end()
            })
        })
    })

    transferRejectedTest.end()
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
      let transferId = Fixtures.generateTransferId()
      let event = Fixtures.buildTransferPreparedEvent(transferId, Fixtures.buildDebitOrCredit(Fixtures.generateAccountName(), '50'), Fixtures.buildDebitOrCredit(Fixtures.generateAccountName(), '50'))

      TransfersReadModel.saveTransferPrepared(event)
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

  modelTest.test('findExpired should', expiredTest => {
    expiredTest.test('retrieve prepared transfers with past expires at', t => {
      let transferId = Fixtures.generateTransferId()
      let event = Fixtures.buildTransferPreparedEvent(transferId, Fixtures.buildDebitOrCredit(Fixtures.generateAccountName(), '50'), Fixtures.buildDebitOrCredit(Fixtures.generateAccountName(), '50'), pastDate())

      let futureTransferId = Fixtures.generateTransferId()
      let futureEvent = Fixtures.buildTransferPreparedEvent(futureTransferId, Fixtures.buildDebitOrCredit(Fixtures.generateAccountName(), '50'), Fixtures.buildDebitOrCredit(Fixtures.generateAccountName(), '50'))

      TransfersReadModel.saveTransferPrepared(event)
        .then(() => TransfersReadModel.saveTransferPrepared(futureEvent))
        .then(() => {
          TransfersReadModel.findExpired()
            .then((found) => {
              t.equal(found.length, 1)
              t.equal(found[0].transferUuid, event.aggregate.id)
              t.end()
            })
        })
    })

    expiredTest.end()
  })

  modelTest.end()
})
