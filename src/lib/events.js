'use strict'

const Events = require('events')
const TransferTranslator = require('../adapters/transfer-translator')
const ledgerEmitter = new Events()

const publish = (path, message) => {
  ledgerEmitter.emit(path, message)
}

const listen = (path, callback) => {
  ledgerEmitter.on(path, (message) => {
    callback(message)
  })
}

module.exports = {
  onTransferPrepared: (callback) => {
    listen('transferPrepared', callback)
  },
  onTransferExecuted: (callback) => {
    listen('transferExecuted', callback)
  },
  onTransferRejected: (callback) => {
    listen('transferRejected', callback)
  },
  emitTransferPrepared: (transfer) => {
    publish('transferPrepared', {
      resource: TransferTranslator.toTransfer(transfer)
    })
  },
  emitTransferExecuted: (resource, relatedResources) => {
    publish('transferExecuted', {
      resource: TransferTranslator.toTransfer(resource),
      related_resources: relatedResources
    })
  },
  emitTransferRejected: (resource, relatedResources) => {
    publish('transferRejected', {
      resource: TransferTranslator.toTransfer(resource),
      related_resources: relatedResources
    })
  }
}
