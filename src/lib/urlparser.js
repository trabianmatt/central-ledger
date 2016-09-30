'use strict'

const Config = require('./config')

const accountRegex = new RegExp(`${Config.HOSTNAME}\/accounts\/([A-Za-z0-9_]*)\/?`, 'i')
const accountsTransfersRouteRegex = new RegExp(/\/accounts\/([A-Za-z0-9_]*)\/transfers/, 'i')

exports.parseAccountName = function (url, callback) {
  let matches = url.match(accountRegex)
  if (matches) {
    callback(null, matches[1])
  } else {
    callback('no match', null)
  }
}

exports.accountNameFromTransfersRoute = (url, callback) => {
  let match = url.match(accountsTransfersRouteRegex)
  if (match) {
    callback(null, match[1])
  } else {
    callback('no match', null)
  }
}

exports.toTransferUri = function (id) {
  return `${Config.HOSTNAME}/transfers/${id}`
}

exports.toAccountUri = function (name) {
  return `${Config.HOSTNAME}/accounts/${name}`
}
