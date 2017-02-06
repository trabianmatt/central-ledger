'use strict'

let host = process.env.HOST_IP || 'localhost'
const RequestApi = require('supertest-as-promised')('http://' + host + ':3000')
const RequestAdmin = require('supertest-as-promised')('http://' + host + ':3001')
const Encoding = require('@leveloneproject/central-services-shared').Encoding

const basicAuth = (name, password) => {
  const credentials = Encoding.toBase64(name + ':' + password)
  return { 'Authorization': `Basic ${credentials}` }
}

function getApi (path, headers = {}) {
  return RequestApi.get(path).set(headers)
}

function postApi (path, data, contentType = 'application/json') {
  return RequestApi.post(path).set('Content-Type', contentType).send(data)
}

function putApi (path, data, contentType = 'application/json') {
  return RequestApi.put(path).set('Content-Type', contentType).send(data)
}

function getAdmin (path, headers = {}) {
  return RequestAdmin.get(path).set(headers)
}

function postAdmin (path, data, contentType = 'application/json') {
  return RequestAdmin.post(path).set('Content-Type', contentType).send(data)
}

function putAdmin (path, data, contentType = 'application/json') {
  return RequestAdmin.put(path).set('Content-Type', contentType).send(data)
}

function createAccount (accountName, password = '1234') {
  return postApi('/accounts', { name: accountName, password: password })
}

function getAccount (accountName) {
  return getApi(`/accounts/${accountName}`)
}

function updateAccount (accountName, isDisabled) {
  return putAdmin(`/accounts/${accountName}`, { is_disabled: isDisabled })
}

function getTransfer (transferId) {
  return getApi(`/transfers/${transferId}`)
}

function getFulfillment (transferId) {
  return getApi(`/transfers/${transferId}/fulfillment`)
}

function prepareTransfer (transferId, transfer) {
  return putApi(`/transfers/${transferId}`, transfer)
}

function fulfillTransfer (transferId, fulfillment) {
  return putApi(`/transfers/${transferId}/fulfillment`, fulfillment, 'text/plain')
}

function rejectTransfer (transferId, reason) {
  return putApi(`/transfers/${transferId}/rejection`, reason, 'text/plain')
}

function createCharge (payload) {
  return postAdmin('/charges', payload)
}

module.exports = {
  basicAuth,
  createAccount,
  createCharge,
  fulfillTransfer,
  getTransfer,
  getFulfillment,
  getApi,
  getAdmin,
  getAccount,
  postApi,
  postAdmin,
  prepareTransfer,
  putApi,
  putAdmin,
  rejectTransfer,
  updateAccount
}
