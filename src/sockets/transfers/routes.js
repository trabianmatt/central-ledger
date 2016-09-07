const Events = require('../../lib/events')
const TransferUpdatePath = '/transfers/updates'

function setupListeners (server) {
  function push (message) {
    server.publish(TransferUpdatePath, message)
  }
  Events.onTransferPrepared((msg) => {
    push(msg)
  })
  Events.onTransferFulfilled((msg) => {
    push(msg)
  })
}

module.exports = function (server) {
  server.subscription(TransferUpdatePath)
  setupListeners(server)
}
