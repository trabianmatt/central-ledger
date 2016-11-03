'use strict'

const Events = require('./events')
const Aggregate = require('./transfer')
const Commands = require('./commands')
const TransfersProjection = require('./transfers-projection')
const SettleableTransfersProjection = require('./settleable-transfers-projection')

let setupTransferId = context => {
  // Monkeypatch a private function exposed on the Transfer aggregate respository. This is a temporary
  // fix until https://github.com/efacilitation/eventric/issues/47 is resolved.

  // The version of eventric is pinned at 0.24.1 to prevent any changes to the behavior of this code.
  let _installSaveFunctionOnAggregateInstance = Object.getPrototypeOf(context._getAggregateRepository('Transfer'))._installSaveFunctionOnAggregateInstance
  let _installSaveFunctionOnAggregateInstanceWithId = function (aggregate) {
    aggregate.instance.$setIdForCreation = function (aggregateId) {
      let item = aggregate._newDomainEvents[0]
      item.aggregate.id = aggregateId
      this.id = aggregateId
      item.ensureIsFirstDomainEvent = true
    }

    return _installSaveFunctionOnAggregateInstance.call(this, aggregate)
  }

  Object.getPrototypeOf(context._getAggregateRepository('Transfer'))._installSaveFunctionOnAggregateInstance = _installSaveFunctionOnAggregateInstanceWithId

  return context
}

exports.setupContext = (context) => {
  context.defineDomainEvents(Events)
  context.addAggregate('Transfer', Aggregate)
  context.addCommandHandlers(Commands)
  context.addProjection(TransfersProjection)
  context.addProjection(SettleableTransfersProjection)
}

exports.onContextInitialized = (context) => {
  return setupTransferId(context)
}
