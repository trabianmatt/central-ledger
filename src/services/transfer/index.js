'use strict'

const _ = require('lodash')
const P = require('bluebird')
const Moment = require('moment')
const TransferState = require('../../domain/transfer/state')
const ReadModel = require('../../models/transfers-read-model')
const SettleableTransfersReadModel = require('../../models/settleable-transfers-read-model')
const SettlementsModel = require('../../models/settlements')
const Account = require('../../domain/account')
const Commands = require('../../domain/transfer/commands')
const UrlParser = require('../../lib/urlparser')

exports.rejectExpired = () => {
  const rejections = ReadModel.findExpired().then(expired => expired.map(x => Commands.expire(x.transferUuid)))
  return P.all(rejections).then(rejections => {
    return rejections.map(r => r.id)
  })
}

exports.settle = () => {
  const settlementId = SettlementsModel.generateId()
  const settledTransfers = SettlementsModel.create(settlementId).then(() => {
    return SettleableTransfersReadModel.getSettleableTransfers().then(
      transfers => transfers.map(x => Commands.settle({id: x.transferId, settlement_id: settlementId})))
  })

  return P.all(settledTransfers).then(settledTransfers => {
    if (settledTransfers.length > 0) {
      return settledTransfers.map(t => t.id)
    } else {
      return P.resolve([])
    }
  })
}

exports.getExecuted = () => {
  return ReadModel.getTransfersByState(TransferState.EXECUTED)
}

exports.saveTransferPrepared = ({aggregate, payload, timestamp}) => {
  const debitAccount = UrlParser.nameFromAccountUri(payload.debits[0].account)
  const creditAccount = UrlParser.nameFromAccountUri(payload.credits[0].account)

  return P.all([debitAccount, creditAccount].map(name => Account.getByName(name)))
    .then(accounts => {
      const accountIds = _.reduce(accounts, (m, acct) => _.set(m, acct.name, acct.accountId), {})

      const record = {
        transferUuid: aggregate.id,
        state: TransferState.PREPARED,
        ledger: payload.ledger,
        debitAccountId: accountIds[debitAccount],
        debitAmount: payload.debits[0].amount,
        debitMemo: payload.debits[0].memo,
        creditAccountId: accountIds[creditAccount],
        creditAmount: payload.credits[0].amount,
        creditMemo: payload.credits[0].memo,
        executionCondition: payload.execution_condition,
        cancellationCondition: payload.cancellation_condition,
        rejectionReason: payload.rejection_reason,
        expiresAt: payload.expires_at,
        additionalInfo: payload.additional_info,
        preparedDate: Moment(timestamp)
      }

      return ReadModel.saveTransfer(record)
    })
}

exports.saveTransferExecuted = ({aggregate, payload, timestamp}) => {
  const fields = {
    state: TransferState.EXECUTED,
    fulfillment: payload.fulfillment,
    executedDate: Moment(timestamp)
  }
  return ReadModel.updateTransfer(aggregate.id, fields)
}

exports.saveTransferRejected = ({aggregate, payload, timestamp}) => {
  const fields = {
    state: TransferState.REJECTED,
    rejectionReason: payload.rejection_reason,
    creditRejected: 1,
    creditRejectionMessage: payload.rejection_reason,
    rejectedDate: Moment(timestamp)
  }
  return ReadModel.updateTransfer(aggregate.id, fields)
}

exports.truncateReadModel = () => {
  return ReadModel.truncateTransfers()
}
