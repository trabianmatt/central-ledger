'use strict'

const Uuid = require('uuid4')
const RejectionType = require('../../src/domain/transfer/rejection-type')

let hostname = 'central-ledger'

function generateTransferId () {
  return Uuid()
}

function generateAccountName () {
  return `dfsp${Uuid().replace(/-/g, '')}`
}

function buildDebitOrCredit (accountName, amount, memo, invoice) {
  return {
    account: `http://${hostname}/accounts/${accountName}`,
    amount: amount,
    memo: memo,
    invoice: invoice,
    authorized: true,
    rejected: false
  }
}

let futureDate = () => {
  let d = new Date()
  d.setTime(d.getTime() + 86400000)
  return d
}

function buildTransfer (transferId, debit, credit, expiresAt) {
  expiresAt = (expiresAt || futureDate()).toISOString()
  return {
    id: `http://${hostname}/transfers/${transferId}`,
    ledger: `http://${hostname}`,
    debits: [debit],
    credits: [credit],
    execution_condition: 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2',
    expires_at: expiresAt
  }
}

function buildTransferPreparedEvent (transferId, debit, credit, expiresAt) {
  expiresAt = (expiresAt || futureDate()).toISOString()
  return {
    id: 1,
    name: 'TransferPrepared',
    payload: {
      ledger: `${hostname}`,
      debits: [debit],
      credits: [credit],
      execution_condition: 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2',
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

function buildTransferExecutedEvent (transferId, debit, credit, expiresAt) {
  expiresAt = (expiresAt || futureDate()).toISOString()
  return {
    id: 2,
    name: 'TransferExecuted',
    payload: {
      ledger: `${hostname}`,
      debits: [debit],
      credits: [credit],
      execution_condition: 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2',
      expires_at: expiresAt,
      fulfillment: 'cf:0:_v8'
    },
    aggregate: {
      id: transferId,
      name: 'Transfer'
    },
    context: 'Ledger',
    timestamp: 1474471284081
  }
}

function buildTransferRejectedEvent (transferId, rejectionReason, rejectionType = RejectionType.CANCELED) {
  return {
    id: 2,
    name: 'TransferRejected',
    payload: {
      rejection_reason: rejectionReason,
      rejection_type: rejectionType
    },
    aggregate: {
      id: transferId,
      name: 'Transfer'
    },
    context: 'Ledger',
    timestamp: 1474471286000
  }
}

function buildReadModelTransfer (transferId, debit, credit, state, expiresAt, preparedDate, rejectionReason) {
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
    debitInvoice: debit.invoice,
    creditAccountId: credit.accountId,
    creditAmount: credit.amount,
    creditMemo: credit.memo,
    creditInvoice: credit.invoice,
    executionCondition: 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2',
    rejectionReason: rejectionReason,
    expiresAt: expiresAt,
    preparedDate: preparedDate
  }
}

function findAccountPositions (positions, accountName) {
  return positions.find(function (p) {
    return p.account === buildAccountUrl(accountName)
  })
}

function buildAccountUrl (accountName) {
  return `http://${hostname}/accounts/${accountName}`
}

function buildAccountPosition (accountName, payments, receipts) {
  return {
    account: buildAccountUrl(accountName),
    net: (receipts - payments).toString(),
    payments: payments.toString(),
    receipts: receipts.toString()
  }
}

module.exports = {
  hostname,
  buildAccountPosition,
  buildDebitOrCredit,
  buildTransfer,
  buildTransferPreparedEvent,
  buildTransferExecutedEvent,
  buildTransferRejectedEvent,
  buildReadModelTransfer,
  findAccountPositions,
  generateAccountName,
  generateTransferId
}
