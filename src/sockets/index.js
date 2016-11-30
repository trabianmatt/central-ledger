'use strict'

const WS = require('ws')
const Uuid = require('uuid4')
const Events = require('../lib/events')
const SocketManager = require('./socket-manager')
const WebSocket = require('./websocket')
const AccountTransfers = require('./account-transfers')

let manager

const createWebSocketServer = (listener) => {
  return new WS.Server({
    server: listener
  })
}

const getAccounts = (transfer) => {
  let credits = transfer.credits || []
  let debits = transfer.debits || []
  return [...credits, ...debits].map(c => c.account)
}

const wireConnection = (webSocketServer) => {
  webSocketServer.on('connection', (ws) => {
    const url = ws.upgradeReq.url
    if (url === '/websocket') {
      WebSocket.initialize(ws, manager)
    } else {
      AccountTransfers.initialize(ws, url, manager)
    }
  })
}

const transferHandler = (msg) => {
  getAccounts(msg.resource).forEach(account => manager.send(account, msg))
}

const formatResource = (event, resource) => {
  return {
    jsonrpc: '2.0',
    id: null,
    method: 'notify',
    params: {
      event: event,
      id: Uuid(),
      resource: resource
    }
  }
}

const messageHandler = (message) => {
  const toAccount = message.to
  manager.send(toAccount, formatResource('message.send', message))
}

const wireEvents = () => {
  Events.onTransferPrepared(transferHandler)
  Events.onTransferExecuted(transferHandler)
  Events.onTransferRejected(transferHandler)
  Events.onMessageSent(messageHandler)
}

exports.register = (server, options, next) => {
  manager = SocketManager.create()
  const wss = createWebSocketServer(server.listener)

  wireConnection(wss)

  wireEvents()

  next()
}

exports.register.attributes = {
  name: 'websockets'
}
