'use strict'

const _ = require('lodash')
const P = require('bluebird')
const Moment = require('moment')
const TransferState = require('../../domain/transfer/state')
const RejectionType = require('../../domain/transfer/rejection-type')
const ReadModel = require('../../models/transfers-read-model')
const SettleableTransfersReadModel = require('../../models/settleable-transfers-read-model')
const SettlementsModel = require('../../models/settlements')
const Account = require('../../domain/account')
const Commands = require('../../commands/transfer')
const UrlParser = require('../../lib/urlparser')

exports.rejectExpired = () => {
  let rejections = ReadModel.findExpired().then(expired => expired.map(x => Commands.expire(x.transferUuid)))
  return P.all(rejections).then(rejections => {
    return rejections.map(r => r.transfer.id)
  })
}

exports.settle = () => {
  let settlementId = SettlementsModel.generateId()
  let settledTransfers = SettlementsModel.create(settlementId).then(() => {
    return SettleableTransfersReadModel.getSettleableTransfers().then(
      transfers => transfers.map(x => Commands.settle({id: x.transferId, settlement_id: settlementId}))) })

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
  let debitAccount = UrlParser.nameFromAccountUri(payload.debits[0].account)
  let creditAccount = UrlParser.nameFromAccountUri(payload.credits[0].account)

  return P.all([debitAccount, creditAccount].map(name => Account.getByName(name)))
    .then(accounts => {
      let accountIds = _.reduce(accounts, (m, acct) => _.set(m, acct.name, acct.accountId), {})

      let record = {
        transferUuid: aggregate.id,
        state: TransferState.PREPARED,
        ledger: payload.ledger,
        debitAccountId: accountIds[debitAccount],
        debitAmount: payload.debits[0].amount,
        debitMemo: payload.debits[0].memo,
        debitInvoice: payload.debits[0].invoice,
        creditAccountId: accountIds[creditAccount],
        creditAmount: payload.credits[0].amount,
        creditMemo: payload.credits[0].memo,
        creditInvoice: payload.credits[0].invoice,
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
  let fields = {
    state: TransferState.EXECUTED,
    fulfillment: payload.fulfillment,
    executedDate: Moment(timestamp)
  }
  return ReadModel.updateTransfer(aggregate.id, fields)
}

exports.saveTransferRejected = ({aggregate, payload, timestamp}) => {
  let fields = {
    state: TransferState.REJECTED,
    rejectionReason: payload.rejection_type || RejectionType.CANCELED,
    creditRejected: 1,
    creditRejectionMessage: payload.rejection_reason,
    rejectedDate: Moment(timestamp)
  }
  return ReadModel.updateTransfer(aggregate.id, fields)
}

exports.truncateReadModel = () => {
  return ReadModel.truncateTransfers()
}
