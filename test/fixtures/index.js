'use strict'

const Uuid = require('uuid4')
const Moment = require('moment')

const hostname = 'central-ledger'
const executionCondition = 'ni:///sha-256;47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU?fpt=preimage-sha-256&cost=0'

const generateTransferId = () => {
  return Uuid()
}

const generateAccountName = () => {
  return `dfsp${Uuid().replace(/-/g, '')}`
}

const buildDebitOrCredit = (accountName, amount, memo) => {
  return {
    account: `http://${hostname}/accounts/${accountName}`,
    amount: amount,
    memo: memo,
    authorized: true
  }
}

const futureDate = () => {
  let d = new Date()
  d.setTime(d.getTime() + 86400000)
  return d
}

const buildTransfer = (transferId, debit, credit, expiresAt) => {
  expiresAt = (expiresAt || futureDate()).toISOString()
  return {
    id: `http://${hostname}/transfers/${transferId}`,
    ledger: `http://${hostname}`,
    debits: [debit],
    credits: [credit],
    execution_condition: executionCondition,
    expires_at: expiresAt
  }
}

const buildUnconditionalTransfer = (transferId, debit, credit) => {
  return {
    id: `http://${hostname}/transfers/${transferId}`,
    ledger: `http://${hostname}`,
    debits: [debit],
    credits: [credit]
  }
}

const buildTransferPreparedEvent = (transferId, debit, credit, expiresAt) => {
  expiresAt = (expiresAt || futureDate()).toISOString()
  return {
    id: 1,
    name: 'TransferPrepared',
    payload: {
      ledger: `${hostname}`,
      debits: [debit],
      credits: [credit],
      execution_condition: executionCondition,
      expires_at: expiresAt
    },
    aggregate: {
      id: transferId,
      name: 'Transfer'
    },
    context: 'Ledger',
    timestamp: 1474471273588
  }
}

const buildTransferExecutedEvent = (transferId, debit, credit, expiresAt) => {
  expiresAt = (expiresAt || futureDate()).toISOString()
  return {
    id: 2,
    name: 'TransferExecuted',
    payload: {
      ledger: `${hostname}`,
      debits: [debit],
      credits: [credit],
      execution_condition: executionCondition,
      expires_at: expiresAt,
      fulfillment: 'oAKAAA'
    },
    aggregate: {
      id: transferId,
      name: 'Transfer'
    },
    context: 'Ledger',
    timestamp: 1474471284081
  }
}

const buildTransferRejectedEvent = (transferId, rejectionReason) => {
  return {
    id: 2,
    name: 'TransferRejected',
    payload: {
      rejection_reason: rejectionReason
    },
    aggregate: {
      id: transferId,
      name: 'Transfer'
    },
    context: 'Ledger',
    timestamp: 1474471286000
  }
}

const buildReadModelTransfer = (transferId, debit, credit, state, expiresAt, preparedDate, rejectionReason) => {
  state = state || 'prepared'
  expiresAt = (expiresAt || futureDate()).toISOString()
  preparedDate = (preparedDate || new Date()).toISOString()
  return {
    transferUuid: transferId,
    state: state,
    ledger: `${hostname}`,
    debitAccountId: debit.accountId,
    debitAmount: debit.amount,
    debitMemo: debit.memo,
    creditAccountId: credit.accountId,
    creditAmount: credit.amount,
    creditMemo: credit.memo,
    executionCondition: executionCondition,
    rejectionReason: rejectionReason,
    expiresAt: expiresAt,
    preparedDate: preparedDate
  }
}

const findAccountPositions = (positions, accountName) => {
  return positions.find(function (p) {
    return p.account === buildAccountUrl(accountName)
  })
}

const buildAccountUrl = (accountName) => {
  return `http://${hostname}/accounts/${accountName}`
}

const buildAccountPosition = (accountName, payments, receipts) => {
  return {
    account: buildAccountUrl(accountName),
    net: (receipts - payments).toString(),
    payments: payments.toString(),
    receipts: receipts.toString()
  }
}

const getMomentToExpire = (timeToPrepareTransfer = 2) => {
  return Moment.utc().add(timeToPrepareTransfer, 'seconds')
}

module.exports = {
  hostname,
  buildAccountPosition,
  buildDebitOrCredit,
  buildTransfer,
  buildUnconditionalTransfer,
  buildTransferPreparedEvent,
  buildTransferExecutedEvent,
  buildTransferRejectedEvent,
  buildReadModelTransfer,
  findAccountPositions,
  generateAccountName,
  generateTransferId,
  getMomentToExpire
}
