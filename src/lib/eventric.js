const Eventric = require('eventric')
const PostgresStore = require('../eventric/postgresStore')
const Fulfillments = require('../cryptoConditions/fulfillments')
const Events = require('./events')

var initializedContext

var transferState = {
  PREPARED: 'prepared',
  EXECUTED: 'executed'
}

/*eslint-disable */
function defineDomainEvents (context) {
  context.defineDomainEvents({
    TransferPrepared ({
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
      this.state = transferState.PREPARED
      return {
        ledger,
        debits,
        credits,
        execution_condition,
        expires_at
      }
    },

    TransferExecuted () {
      this.state = transferState.EXECUTED
    }
})
}
/*eslint-enable */

function addAggregates (context) {
  context.addAggregate('Transfer', class Transfer {
    create ({
      ledger,
      debits,
      credits,
      execution_condition,
      expires_at
    }) {
      return this.$emitDomainEvent('TransferPrepared', {
        ledger,
        debits,
        credits,
        execution_condition,
        expires_at
      })
    }

    fulfill ({
      fulfillment
    }) {
      if (this.state !== transferState.PREPARED) {
        throw new Error('transfer is not prepared')
      }

      Fulfillments.validateConditionFulfillment(this.execution_condition, fulfillment)

      return this.$emitDomainEvent('TransferExecuted', { fulfillment })
    }
})
}

function addCommandHandlers (context) {
  context.addCommandHandlers({
    PrepareTransfer ({
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
    },

    FulfillTransfer ({
      id, fulfillment
    }) {
      return this.$aggregate.load('Transfer', id)
      .then(function (transfer) {
        transfer.fulfill({fulfillment})
        return transfer.$save()
      })
    }
  })
}

function addEventListeners (context) {
  context.subscribeToDomainEvent('TransferPrepared', domainEvent => {
    Events.emitTransferPrepared(domainEvent.payload)
  })
}

exports.getContext = () => {
  if (!initializedContext) {
    Eventric.setStore(PostgresStore.default, {})
    var context = Eventric.context('Ledger')

    defineDomainEvents(context)
    addAggregates(context)
    addCommandHandlers(context)
    addEventListeners(context)
    initializedContext = context.initialize().then(() => context)
  }

  return initializedContext
}
