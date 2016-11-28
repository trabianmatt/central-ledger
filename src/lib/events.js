const Events = require('events')
const TransferTranslator = require('../adapters/transfer-translator')
const ledgerEmitter = new Events()

function publish (path, message) {
  ledgerEmitter.emit(path, message)
}

function listen (path, callback) {
  ledgerEmitter.on(path, (message) => {
    callback(message)
  })
}

module.exports = {
  onTransferPrepared: function (callback) {
    listen('transferPrepared', callback)
  },
  onTransferExecuted: function (callback) {
    listen('transferExecuted', callback)
  },
  emitTransferPrepared: function (transfer) {
    publish('transferPrepared', {
      resource: TransferTranslator.toTransfer(transfer)
    })
  },
  emitTransferExecuted: function (resource, relatedResources) {
    publish('transferExecuted', {
      resource: TransferTranslator.toTransfer(resource),
      related_resources: relatedResources
    })
  },
  emitTransferRejected: function (resource, relatedResources) {
    publish('transferRejected', {
      resource: resource,
      related_resources: relatedResources
    })
  }
}
