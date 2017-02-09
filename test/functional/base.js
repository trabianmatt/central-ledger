'use strict'

const host = process.env.HOST_IP || 'localhost'
const RequestApi = require('supertest')('http://' + host + ':3000')
const RequestAdmin = require('supertest')('http://' + host + ':3001')
const P = require('bluebird')
const Encoding = require('@leveloneproject/central-services-shared').Encoding
const DA = require('deasync-promise')

const basicAuth = (name, password) => {
  const credentials = Encoding.toBase64(name + ':' + password)
  return { 'Authorization': `Basic ${credentials}` }
}

let account1promise
let account2promise
const account1 = () => {
  if (!account1promise) {
    account1promise = createAccount('dfsp1', 'dfsp1').then(res => res.body)
  }
  return DA(account1promise)
}

const account2 = () => {
  if (!account2promise) {
    account2promise = createAccount('dfsp2', 'dfsp2').then(res => res.body)
  }
  return DA(account2promise)
}

const getApi = (path, headers = {}) => RequestApi.get(path).set(headers)

const postApi = (path, data, contentType = 'application/json') => RequestApi.post(path).set('Content-Type', contentType).send(data)

const putApi = (path, data, contentType = 'application/json') => RequestApi.put(path).set('Content-Type', contentType).send(data)

const getAdmin = (path, headers = {}) => RequestAdmin.get(path).set(headers)

const postAdmin = (path, data, contentType = 'application/json') => RequestAdmin.post(path).set('Content-Type', contentType).send(data)

const putAdmin = (path, data, contentType = 'application/json') => RequestAdmin.put(path).set('Content-Type', contentType).send(data)

const createAccount = (accountName, password = '1234') => postApi('/accounts', { name: accountName, password: password })

const getAccount = (accountName) => getApi(`/accounts/${accountName}`)

const updateAccount = (accountName, isDisabled) => putAdmin(`/accounts/${accountName}`, { is_disabled: isDisabled })

const getTransfer = (transferId) => getApi(`/transfers/${transferId}`)

const getFulfillment = (transferId) => getApi(`/transfers/${transferId}/fulfillment`)

const prepareTransfer = (transferId, transfer) => P.resolve(putApi(`/transfers/${transferId}`, transfer))

const fulfillTransfer = (transferId, fulfillment) => putApi(`/transfers/${transferId}/fulfillment`, fulfillment, 'text/plain')

const rejectTransfer = (transferId, reason) => putApi(`/transfers/${transferId}/rejection`, reason, 'text/plain')

const createCharge = (payload) => postAdmin('/charges', payload)

module.exports = {
  account1Name: account1().name,
  account2Name: account2().name,
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
