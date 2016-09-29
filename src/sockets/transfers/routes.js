'use strict'

const Events = require('../../lib/events')
const UrlParser = require('../../lib/urlparser')
const TransferUpdatePath = '/accounts/{name}/transfers'

function convertTransfer (transfer) {
  transfer.resource.id = UrlParser.toTransferUri(transfer.resource.id)
  return transfer
}

function getAccounts (transfer) {
  let credits = transfer.credits || []
  let debits = transfer.debits || []
  return [...credits, ...debits].map(c => c.account)
}

function setupListeners (server) {
  function push (path, message) {
    server.publish(path, message)
  }
  Events.onTransferPrepared((msg) => {
    let transfer = convertTransfer(msg)
    getAccounts(transfer.resource).forEach(a => UrlParser.parseAccountName(a, (err, accountName) => {
      if (!err) {
        push(`/accounts/${accountName}/transfers`, transfer)
      }
    }))
  })
  Events.onTransferExecuted((msg) => {
    let transfer = convertTransfer(msg)
    getAccounts(transfer.resource).forEach(a => UrlParser.parseAccountName(a, (err, accountName) => {
      if (!err) {
        push(`/accounts/${accountName}/transfers`, transfer)
      }
    }))
  })
}

module.exports = function (server) {
  server.subscription(TransferUpdatePath)
  setupListeners(server)
}
