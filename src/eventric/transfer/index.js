'use strict'

const Events = require('./events')
const Aggregate = require('./transfer')
const Commands = require('./commands')
const TransfersProjection = require('./transfers-projection')
const SettleableTransfersProjection = require('./settleable-transfers-projection')

exports.setupContext = (context) => {
  context.defineDomainEvents(Events)
  context.addAggregate('Transfer', Aggregate)
  context.addCommandHandlers(Commands)
  context.addProjection(TransfersProjection)
  context.addProjection(SettleableTransfersProjection)
}
