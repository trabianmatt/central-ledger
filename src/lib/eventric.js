const Eventric = require('eventric')
const PostgresStore = require('../eventric/postgresStore')

var initializedContext

/*eslint-disable */
function _defineDomainEvents (context) {
  context.defineDomainEvents({
    TransferProposed ({
      ledger,
      debits,
      credits,
      execution_condition,
      expires_at
    }) {
      this.ledger = ledger
      this.debits = debits
      this.credits = credits
      this.execution_condition = execution_condition
      this.expires_at = expires_at
      return {
        ledger,
        debits,
        credits,
        execution_condition,
        expires_at
      }
    }})
}
/*eslint-enable */

function _addAggregates (context) {
  context.addAggregate('Transfer', class Transfer {
    create ({
      ledger,
      debits,
      credits,
      execution_condition,
      expires_at
    }) {
      return this.$emitDomainEvent('TransferProposed', {
        ledger,
        debits,
        credits,
        execution_condition,
        expires_at
      })
    }})
}

function _addCommandHandlers (context) {
  context.addCommandHandlers({
    ProposeTransfer ({
      ledger,
      debits,
      credits,
      execution_condition,
      expires_at
    }) {
      return this.$aggregate.create('Transfer', {
        ledger,
        debits,
        credits,
        execution_condition,
        expires_at
      })
                        .then(
                        transfer => transfer.$save())
    }
  })
}

exports.getContext = () => {
  if (!initializedContext) {
    Eventric.setStore(PostgresStore.default, {})
    var context = Eventric.context('Ledger')

    _defineDomainEvents(context)
    _addAggregates(context)
    _addCommandHandlers(context)
    initializedContext = context.initialize().then(() => context)
  }

  return initializedContext
}
