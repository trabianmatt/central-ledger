const Events = require('events')
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
  onTransferFulfilled: function (callback) {
    listen('transferFulfilled', callback)
  },
  emitTransferPrepared: function (transfer) {
    publish('transferPrepared', {
      resource: transfer
    })
  },
  emitTransferFulfilled: function (transfer) {
    publish('transferFulfilled', transfer)
  }
}
