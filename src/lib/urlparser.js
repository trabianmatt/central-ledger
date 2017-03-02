'use strict'

const P = require('bluebird')
const Config = require('./config')

const accountRegex = new RegExp(`${Config.HOSTNAME}/accounts/([A-Za-z0-9_]*)/?`, 'i')
const transfersRegex = new RegExp(`${Config.HOSTNAME}/transfers/([a-f\\d]{8}(-[a-f\\d]{4}){3}-[a-f\\d]{12})`, 'i')
const accountsTransfersRouteRegex = new RegExp(/\/accounts\/([A-Za-z0-9_]*)\/transfers/, 'i')

const nameFromAccountUri = (uri, callback) => {
  const matches = uri.match(accountRegex)
  const hasCallback = (typeof callback === 'function')
  if (matches) {
    return (hasCallback) ? callback(null, matches[1]) : matches[1]
  } else {
    return (hasCallback) ? callback('no match', null) : null
  }
}

const accountNameFromTransfersRoute = (url) => {
  return new P((resolve, reject) => {
    const matches = url.match(accountsTransfersRouteRegex)
    if (matches) {
      resolve(matches[1])
    } else {
      reject(new Error('No matching account found in url'))
    }
  })
}

const idFromTransferUri = (uri, callback) => {
  const matches = uri.match(transfersRegex)
  const hasCallback = (typeof callback === 'function')
  if (matches) {
    return hasCallback ? callback(null, matches[1]) : matches[1]
  } else {
    return hasCallback ? callback('no match', null) : null
  }
}

const toTransferUri = (id) => {
  const matches = id.match(transfersRegex)
  return (matches ? id : `${Config.HOSTNAME}/transfers/${id}`)
}

const toAccountUri = (name) => {
  const matches = name.match(accountRegex)
  return (matches ? name : `${Config.HOSTNAME}/accounts/${name}`)
}

module.exports = {
  accountNameFromTransfersRoute,
  nameFromAccountUri,
  idFromTransferUri,
  toTransferUri,
  toAccountUri
}
