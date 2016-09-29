'use strict'

const Config = require('./config')

let accountRegex = new RegExp(`${Config.HOSTNAME}\/accounts\/([A-Za-z0-9_]*)\/?`, 'i')

exports.parseAccountName = function (url, callback) {
  let matches = url.match(accountRegex)
  if (matches) {
    callback(null, matches[1])
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
