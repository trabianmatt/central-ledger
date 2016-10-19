const Eventric = require('eventric')
const P = require('bluebird')
const PostgresStore = require('./postgres-store')
const Transfer = require('./transfer')

let initializedContext

exports.getContext = () => {
  if (!initializedContext) {
    Eventric.setStore(PostgresStore.default, {})
    let context = Eventric.context('Ledger')
    Transfer.setupContext(context)
    initializedContext = P.resolve(context.initialize())
      .then(c => Transfer.onContextInitialized(context))
  }

  return initializedContext
}
