const Eventric = require('eventric')
const Events = require('./events')
const PostgresStore = require('../eventric/postgresStore')
const Transfer = require('../eventric/transfer/transfer')
const TransferEvents = require('../eventric/transfer/events')
const TransferCommands = require('../eventric/transfer/commands')
const TransferProjection = require('../eventric/transfer/projection')

let initializedContext

function defineDomainEvents (context) {
  context.defineDomainEvents(TransferEvents)
}

function addAggregates (context) {
  context.addAggregate('Transfer', Transfer)
}

function addCommandHandlers (context) {
  context.addCommandHandlers(TransferCommands)
}

function addProjections (context) {
  context.addProjection(TransferProjection)
}

function addEventListeners (context) {
  context.subscribeToDomainEvent('TransferPrepared', domainEvent => {
    Events.emitTransferPrepared(domainEvent.payload)
  })

  context.subscribeToDomainEvent('TransferExecuted', domainEvent => {
    Events.emitTransferExecuted(domainEvent.payload)
  })
}

exports.getContext = () => {
  if (!initializedContext) {
    Eventric.setStore(PostgresStore.default, {})
    let context = Eventric.context('Ledger')

    defineDomainEvents(context)
    addAggregates(context)
    addCommandHandlers(context)
    addProjections(context)
    addEventListeners(context)
    initializedContext = context.initialize().then(() => {
      // Monkeypatch a private function exposed on the Transfer aggregate respository. This is a temporary
      // fix until https://github.com/efacilitation/eventric/issues/47 is resolved.

      // The version of eventric is pinned at 0.24.1 to prevent any changes to the behavior of this code.
      let _installSaveFunctionOnAggregateInstance = Object.getPrototypeOf(context._getAggregateRepository('Transfer'))._installSaveFunctionOnAggregateInstance
      let _installSaveFunctionOnAggregateInstanceWithId = function (aggregate) {
        aggregate.instance.$setIdForCreation = function (aggregateId) {
          let item = aggregate._newDomainEvents[0]
          item.aggregate.id = aggregateId
          item.ensureIsFirstDomainEvent = true
        }

        return _installSaveFunctionOnAggregateInstance.call(this, aggregate)
      }

      Object.getPrototypeOf(context._getAggregateRepository('Transfer'))._installSaveFunctionOnAggregateInstance = _installSaveFunctionOnAggregateInstanceWithId

      return context
    })
  }

  return initializedContext
}
