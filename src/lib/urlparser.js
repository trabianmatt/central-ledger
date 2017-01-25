'use strict'

const P = require('bluebird')
const Config = require('./config')

const accountRegex = new RegExp(`${Config.HOSTNAME}/accounts/([A-Za-z0-9_]*)/?`, 'i')
const transfersRegex = new RegExp(`${Config.HOSTNAME}/transfers/([a-f\\d]{8}(-[a-f\\d]{4}){3}-[a-f\\d]{12})`, 'i')
const accountsTransfersRouteRegex = new RegExp(/\/accounts\/([A-Za-z0-9_]*)\/transfers/, 'i')

exports.nameFromAccountUri = (uri, callback) => {
  const matches = uri.match(accountRegex)
  const hasCallback = (typeof callback === 'function')
  if (matches) {
    return (hasCallback) ? callback(null, matches[1]) : matches[1]
  } else {
    return (hasCallback) ? callback('no match', null) : null
  }
}

exports.accountNameFromTransfersRoute = (url) => {
  return new P((resolve, reject) => {
    const matches = url.match(accountsTransfersRouteRegex)
    if (matches) {
      resolve(matches[1])
    } else {
      reject('no match')
    }
  })
}

exports.idFromTransferUri = (uri, callback) => {
  const matches = uri.match(transfersRegex)
  const hasCallback = (typeof callback === 'function')
  if (matches) {
    return hasCallback ? callback(null, matches[1]) : matches[1]
  } else {
    return hasCallback ? callback('no match', null) : null
  }
}

exports.toTransferUri = (id) => {
  return `${Config.HOSTNAME}/transfers/${id}`
}

exports.toAccountUri = (name) => {
  return `${Config.HOSTNAME}/accounts/${name}`
}
