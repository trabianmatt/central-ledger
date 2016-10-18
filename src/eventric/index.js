const Eventric = require('eventric')
const P = require('bluebird')
const PostgresStore = require('./postgres-store')
const TransferInitialize = require('./transfer/initialize')

let initializedContext

exports.getContext = () => {
  if (!initializedContext) {
    Eventric.setStore(PostgresStore.default, {})
    let context = Eventric.context('Ledger')
    TransferInitialize.setupContext(context)
    initializedContext = P.resolve(context.initialize())
      .then(c => TransferInitialize.onContextInitialized(context))
  }

  return initializedContext
}
