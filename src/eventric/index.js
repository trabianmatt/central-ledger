const Eventric = require('eventric')
const Events = require('../lib/events')
const PostgresStore = require('./postgres-store')
const Transfer = require('./transfer/transfer')
const TransferEvents = require('./transfer/events')
const TransferCommands = require('./transfer/commands')
const TransferProjection = require('./transfer/projection')

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
    domainEvent.payload.id = domainEvent.aggregate.id
    domainEvent.payload.state = 'prepared'
    Events.emitTransferPrepared(domainEvent.payload)
  })

  context.subscribeToDomainEvent('TransferExecuted', domainEvent => {
    let resource = {
      id: domainEvent.aggregate.id,
      state: 'executed',
      ledger: domainEvent.payload.ledger,
      debits: domainEvent.payload.debits,
      credits: domainEvent.payload.credits,
      execution_condition: domainEvent.payload.execution_condition,
      expires_at: domainEvent.payload.expires_at
    }

    let relatedResources = {
      execution_condition_fulfillment: domainEvent.payload.fulfillment
    }

    Events.emitTransferExecuted(resource, relatedResources)
  })
}

let setupTransferId = context => {
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
}

exports.setupTransferId = setupTransferId

exports.getContext = () => {
  if (!initializedContext) {
    Eventric.setStore(PostgresStore.default, {})
    let context = Eventric.context('Ledger')

    defineDomainEvents(context)
    addAggregates(context)
    addCommandHandlers(context)
    addProjections(context)
    addEventListeners(context)
    initializedContext = context.initialize().then(c => { return setupTransferId(context) })
  }

  return initializedContext
}
