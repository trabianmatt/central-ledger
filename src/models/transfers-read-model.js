'use strict'

const Moment = require('moment')
const Db = require('../lib/db')
const TransferState = require('../domain/transfer/state')
const RejectionType = require('../domain/transfer/rejection-type')

exports.getExecuted = () => {
  return Db.connect().then(db => db.transfers.findAsync({ state: TransferState.EXECUTED }))
}

exports.findExpired = (expirationDate) => {
  let expiresAt = (expirationDate || Moment.utc()).toISOString()
  return Db.connect().then(db => db.transfers.findAsync({ state: TransferState.PREPARED, 'expiresAt <': expiresAt }))
}

exports.saveTransferPrepared = ({ aggregate, payload, timestamp }) => {
  return Db.connect()
    .then(db => db.transfers.insertAsync(
      {
        transferUuid: aggregate.id,
        state: TransferState.PREPARED,
        ledger: payload.ledger,
        debitAccount: payload.debits[0].account,
        debitAmount: payload.debits[0].amount,
        debitMemo: payload.debits[0].memo,
        debitInvoice: payload.debits[0].invoice,
        creditAccount: payload.credits[0].account,
        creditAmount: payload.credits[0].amount,
        creditMemo: payload.credits[0].memo,
        creditInvoice: payload.credits[0].invoice,
        executionCondition: payload.execution_condition,
        cancellationCondition: payload.cancellation_condition,
        rejectionReason: payload.rejection_reason,
        expiresAt: payload.expires_at,
        additionalInfo: payload.additional_info,
        preparedDate: Moment(timestamp)
      })
    )
}

exports.saveTransferExecuted = ({ aggregate, payload, timestamp }) => {
  return Db.connect().then(db => {
    return db.transfers.updateAsync(
      {
        transferUuid: aggregate.id,
        state: TransferState.EXECUTED,
        fulfillment: payload.fulfillment,
        executedDate: Moment(timestamp)
      })
  })
}

exports.saveTransferRejected = ({ aggregate, payload, timestamp }) => {
  return Db.connect().then(db => {
    return db.transfers.updateAsync(
      {
        transferUuid: aggregate.id,
        state: TransferState.REJECTED,
        rejectionReason: payload.rejection_type || RejectionType.CANCELED,
        creditRejected: 1,
        creditRejectionMessage: payload.rejection_reason,
        rejectedDate: Moment(timestamp)
      }
    )
  })
}

exports.truncateReadModel = () => {
  return Db.connect().then(db => db.transfers.destroyAsync({}))
}

exports.getById = (id) => {
  return Db.connect().then(db => db.transfers.findOneAsync({ transferUuid: id }))
}
