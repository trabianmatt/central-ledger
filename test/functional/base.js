'use strict'

let host = process.env.HOST_IP || 'localhost'
const Request = require('supertest-as-promised')('http://' + host + ':3000')
const Encoding = require('@leveloneproject/central-services-shared').Encoding

const basicAuth = (name, password) => {
  const credentials = Encoding.toBase64(name + ':' + password)
  return { 'Authorization': `Basic ${credentials}` }
}

function get (path, headers = {}) {
  return Request.get(path).set(headers)
}

function post (path, data, contentType = 'application/json') {
  return Request.post(path).set('Content-Type', contentType).send(data)
}

function put (path, data, contentType = 'application/json') {
  return Request.put(path).set('Content-Type', contentType).send(data)
}

function createAccount (accountName) {
  return post('/accounts', { name: accountName })
}

function getAccount (accountName) {
  return get(`/accounts/${accountName}`)
}

function getTransfer (transferId) {
  return get(`/transfers/${transferId}`)
}

function getFulfillment (transferId) {
  return get(`/transfers/${transferId}/fulfillment`)
}

function prepareTransfer (transferId, transfer) {
  return put(`/transfers/${transferId}`, transfer)
}

function fulfillTransfer (transferId, fulfillment) {
  return put(`/transfers/${transferId}/fulfillment`, fulfillment, 'text/plain')
}

function rejectTransfer (transferId, reason) {
  return put(`/transfers/${transferId}/rejection`, reason, 'text/plain')
}

module.exports = {
  basicAuth,
  createAccount,
  fulfillTransfer,
  getTransfer,
  getFulfillment,
  get,
  getAccount,
  post,
  prepareTransfer,
  put,
  rejectTransfer
}
