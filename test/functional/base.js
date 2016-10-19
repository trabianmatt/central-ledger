'use strict'

let host = process.env.HOST_IP || 'localhost'
const Request = require('supertest')('http://' + host + ':3000')
const Uuid = require('uuid4')

let accountCounter = 0
let hostname = 'central-ledger'

function get (path) {
  return Request.get(path)
}

function post (path, data, contentType = 'application/json') {
  return Request.post(path).set('Content-Type', contentType).send(data)
}

function put (path, data, contentType = 'application/json') {
  return Request.put(path).set('Content-Type', contentType).send(data)
}

function generateTransferId () {
  return Uuid()
}

function generateAccountName () {
  return `dfsp${++accountCounter}`
}

function createAccount (accountName) {
  return post('/accounts', { name: accountName })
}

function getAccount (accountName) {
  return get(`/accounts/${accountName}`)
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

function prepareTransfer (transferId, transfer) {
  return put('/transfers/' + transferId, transfer)
}

function fulfillTransfer (transferId, fulfillment) {
  return put(`/transfers/${transferId}/fulfillment`, fulfillment, 'text/plain')
}

function rejectTransfer (transferId, reason) {
  return put(`/transfers/${transferId}/rejection`, reason, 'text/plain')
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
  createAccount,
  findAccountPositions,
  fulfillTransfer,
  generateAccountName,
  generateTransferId,
  get,
  getAccount,
  post,
  prepareTransfer,
  put,
  rejectTransfer
}
