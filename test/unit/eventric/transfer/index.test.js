'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Transfer = require('../../../../src/eventric/transfer')
const TransferEvents = require('../../../../src/eventric/transfer/events')
const Aggregate = require('../../../../src/eventric/transfer/transfer')
const Commands = require('../../../../src/eventric/transfer/commands')
const Projection = require('../../../../src/eventric/transfer/projection')

Test('Index should', initializeTest => {
  initializeTest.test('setupContext should', setupTest => {
    setupTest.test('add transfer objects to context', t => {
      let context = {
        defineDomainEvents: Sinon.stub(),
        addAggregate: Sinon.stub(),
        addCommandHandlers: Sinon.stub(),
        addProjection: Sinon.stub()
      }
      Transfer.setupContext(context)
      t.ok(context.defineDomainEvents.calledWith(TransferEvents))
      t.ok(context.addAggregate.calledWith('Transfer', Aggregate))
      t.ok(context.addCommandHandlers.calledWith(Commands))
      t.ok(context.addProjection.calledWith(Projection))

      t.end()
    })
    setupTest.end()
  })

  initializeTest.test('onContextInitialized should', onInitTest => {
    onInitTest.test('setup transfer id and return context', t => {
      let context = {
        _getAggregateRepository: Sinon.stub()
      }
      let aggregateRepository = {}
      context._getAggregateRepository.returns(aggregateRepository)
      t.notOk(aggregateRepository._installSaveFunctionOnAggregateInstance)

      let result = Transfer.onContextInitialized(context)
      t.equal(result, context)
      t.ok(aggregateRepository._installSaveFunctionOnAggregateInstance)
      t.end()
    })
    onInitTest.end()
  })
  initializeTest.end()
})
