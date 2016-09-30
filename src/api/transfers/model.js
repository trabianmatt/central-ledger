'use strict'

const Moment = require('moment')
const P = require('bluebird')
const Db = require('../../lib/db')
const Eventric = require('../../lib/eventric')

function parseIdFor (transfer) {
  return transfer.id.substr(transfer.id.lastIndexOf('/') + 1)
}

exports.prepare = (transfer) => {
  return P.resolve(
    Eventric.getContext()
      .then(context => {
        return context.command('PrepareTransfer', {
          id: parseIdFor(transfer),
          ledger: transfer.ledger,
          debits: transfer.debits,
          credits: transfer.credits,
          execution_condition: transfer.execution_condition,
          expires_at: transfer.expires_at
        })
      })
      .then(() => {
        return {
          id: transfer.id,
          ledger: transfer.ledger,
          debits: transfer.debits,
          credits: transfer.credits,
          execution_condition: transfer.execution_condition,
          expires_at: transfer.expires_at
        }
      })
    )
}

exports.fulfill = (fulfillment) => {
  return P.resolve(
    Eventric.getContext()
      .then(context => {
        return context.command('FulfillTransfer', {
          id: fulfillment.id,
          fulfillment: fulfillment.fulfillment
        })
      })
      .then(() => {
        return fulfillment.fulfillment
      })
  )
}

exports.getExecuted = () => {
  return Db.connect().then(db => db.transfers.findAsync({ state: 'executed' }))
}

exports.saveTransferPrepared = (preparedEvent) => {
  return Db.connect()
    .then(db => db.transfers.insertAsync(
      {
        transferUuid: preparedEvent.aggregate.id,
        state: 'prepared',
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

      if (transfer.state === 'executed') {
        throw new Error('The transfer ' + transfer.transferUuid + ' has already been saved as executed')
      }

      return db.transfers.updateAsync(
        {
          transferUuid: transfer.transferUuid,
          state: 'executed',
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
