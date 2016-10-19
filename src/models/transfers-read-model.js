'use strict'

const Moment = require('moment')
const Db = require('../lib/db')
const TransferState = require('../eventric/transfer/state')

exports.getExecuted = () => {
  return Db.connect().then(db => db.transfers.findAsync({ state: TransferState.EXECUTED }))
}

exports.findExpired = (expirationDate) => {
  let expiresAt = (expirationDate || new Date()).toISOString()
  return Db.connect().then(db => db.transfers.findAsync({ state: TransferState.PREPARED, 'expiresAt <': expiresAt }))
}

exports.saveTransferPrepared = (preparedEvent) => {
  return Db.connect()
    .then(db => db.transfers.insertAsync(
      {
        transferUuid: preparedEvent.aggregate.id,
        state: TransferState.PREPARED,
        ledger: preparedEvent.payload.ledger,
        debitAccount: preparedEvent.payload.debits[0].account,
        debitAmount: preparedEvent.payload.debits[0].amount,
        debitMemo: preparedEvent.payload.debits[0].memo,
        debitInvoice: preparedEvent.payload.debits[0].invoice,
        creditAccount: preparedEvent.payload.credits[0].account,
        creditAmount: preparedEvent.payload.credits[0].amount,
        creditMemo: preparedEvent.payload.credits[0].memo,
        creditInvoice: preparedEvent.payload.credits[0].invoice,
        executionCondition: preparedEvent.payload.execution_condition,
        cancellationCondition: preparedEvent.payload.cancellation_condition,
        rejectionReason: preparedEvent.payload.rejection_reason,
        expiresAt: preparedEvent.payload.expires_at,
        additionalInfo: preparedEvent.payload.additional_info,
        preparedDate: Moment(preparedEvent.timestamp)
      })
    )
}

exports.saveTransferExecuted = (executedEvent) => {
  let db

  return Db.connect()
    .then(conn => {
      db = conn
      return db.transfers.findOneAsync({ transferUuid: executedEvent.aggregate.id })
    })
    .then(transfer => {
      if (!transfer) {
        throw new Error('The transfer ' + executedEvent.aggregate.id + ' has not been saved as prepared yet')
      }

      if (transfer.state === TransferState.EXECUTED) {
        throw new Error('The transfer ' + transfer.transferUuid + ' has already been saved as executed')
      }

      return db.transfers.updateAsync(
        {
          transferUuid: transfer.transferUuid,
          state: TransferState.EXECUTED,
          fulfillment: executedEvent.payload.fulfillment,
          executedDate: Moment(executedEvent.timestamp)
        })
    })
}

exports.truncateReadModel = () => {
  return Db.connect().then(db => db.transfers.destroyAsync({}))
}

exports.getById = (id) => {
  return Db.connect().then(db => db.transfers.findOneAsync({ transferUuid: id }))
}
