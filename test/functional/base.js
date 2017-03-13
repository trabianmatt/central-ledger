'use strict'

const host = process.env.HOST_IP || 'localhost'
const RequestApi = require('supertest')('http://' + host + ':3000')
const RequestAdmin = require('supertest')('http://' + host + ':3001')
const P = require('bluebird')
const Encoding = require('@leveloneproject/central-services-shared').Encoding
const DA = require('deasync-promise')

const account1Name = 'dfsp1'
const account2Name = 'dfsp2'

const basicAuth = (name, password) => {
  const credentials = Encoding.toBase64(name + ':' + password)
  return { 'Authorization': `Basic ${credentials}` }
}

let account1promise
let account2promise
const account1 = () => {
  if (!account1promise) {
    account1promise = createAccount(account1Name, account1Name).then(res => res.body)
  }
  return DA(account1promise)
}

const account2 = () => {
  if (!account2promise) {
    account2promise = createAccount(account2Name, account2Name).then(res => res.body)
  }
  return DA(account2promise)
}

const getApi = (path, headers = {}) => RequestApi.get(path).auth('admin', 'admin').set(headers)

const postApi = (path, data, auth = { name: 'admin', password: 'admin' }, contentType = 'application/json') => RequestApi.post(path).auth(auth.name, auth.password).set('Content-Type', contentType).send(data)

const putApi = (path, data, auth = { name: 'admin', password: 'admin' }, contentType = 'application/json') => RequestApi.put(path).auth(auth.name, auth.password).set('Content-Type', contentType).send(data)

const getAdmin = (path, headers = {}) => RequestAdmin.get(path).set(headers)

const postAdmin = (path, data, contentType = 'application/json') => RequestAdmin.post(path).set('Content-Type', contentType).send(data)

const putAdmin = (path, data, contentType = 'application/json') => RequestAdmin.put(path).set('Content-Type', contentType).send(data)

const createAccount = (accountName, password = '1234') => postApi('/accounts', { name: accountName, password: password })

const getAccount = (accountName) => getApi(`/accounts/${accountName}`)

const updateAccount = (accountName, isDisabled) => putAdmin(`/accounts/${accountName}`, { is_disabled: isDisabled })

const getTransfer = (transferId) => getApi(`/transfers/${transferId}`)

const getFulfillment = (transferId) => getApi(`/transfers/${transferId}/fulfillment`)

const prepareTransfer = (transferId, transfer) => P.resolve(putApi(`/transfers/${transferId}`, transfer))

const fulfillTransfer = (transferId, fulfillment, auth) => putApi(`/transfers/${transferId}/fulfillment`, fulfillment, auth, 'text/plain')

const rejectTransfer = (transferId, reason, auth) => putApi(`/transfers/${transferId}/rejection`, reason, auth)

const createCharge = (payload) => postAdmin('/charges', payload)

const updateCharge = (name, payload) => putAdmin(`/charges/${name}`, payload)

module.exports = {
  account1Name: account1().name,
  account1Password: account1Name,
  account2Name: account2().name,
  account2Password: account2Name,
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
  updateAccount,
  updateCharge
}
