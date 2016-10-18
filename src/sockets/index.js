'use strict'

const WS = require('ws')
const Boom = require('boom')
const Events = require('../lib/events')
const UrlParser = require('../lib/urlparser')
const AccountListeners = require('./accountlistener')

function getAccounts (transfer) {
  let credits = transfer.credits || []
  let debits = transfer.debits || []
  return [...credits, ...debits].map(c => c.account)
}

let listeners = new AccountListeners()

let transferHandler = (msg) => {
  getAccounts(msg.resource).forEach(a => UrlParser.nameFromAccountUri(a, (err, accountName) => {
    if (!err) {
      listeners.send(accountName, msg)
    }
  }))
}

exports.register = (server, options, next) => {
  let wss = new WS.Server({
    server: server.listener
  })

  wss.on('connection', (ws) => {
    let url = ws.upgradeReq.url
    UrlParser.accountNameFromTransfersRoute(url, (err, accountName) => {
      if (err) {
        ws.send(JSON.stringify(Boom.notFound()))
        ws.close()
      } else {
        listeners.add(accountName, ws)
      }
    })
  })

  Events.onTransferPrepared(transferHandler)

  Events.onTransferExecuted(transferHandler)

  next()
}

exports.register.attributes = {
  name: 'websockets'
}
