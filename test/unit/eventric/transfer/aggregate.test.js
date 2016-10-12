'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Eventric = require('eventric')
const ET = require(`${src}/eventric/index`)
const P = require('bluebird')
const Sinon = require('sinon')
const Transfer = require(`${src}/eventric/transfer/transfer`)
const TransferCommands = require(`${src}/eventric/transfer/commands`)
const TransferEvents = require(`${src}/eventric/transfer/events`)
const CryptoConditions = require(`${src}/cryptoConditions/conditions`)
const AlreadyExistsError = require(`${src}/errors/already-exists-error`)

let createTransfer = () => {
  return {
    id: 'test',
    ledger: 'ledger',
    debits: 'debits',
    credits: 'credits',
    execution_condition: 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2',
    expires_at: 'expires_at'
  }
}

let compareTransfers = (assert, transfer1, transfer2) => {
  assert.equal(transfer1.ledger, transfer2.ledger)
  assert.equal(transfer1.debits, transfer2.debits)
  assert.equal(transfer1.credits, transfer2.credits)
  assert.equal(transfer1.execution_condition, transfer2.execution_condition)
  assert.equal(transfer1.expires_at, transfer2.expires_at)
}

Test('Transfer aggregate', aggregateTest => {
  let sandbox
  let context

  aggregateTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(CryptoConditions, 'validateCondition')
    CryptoConditions.validateCondition.returns(true)
    context = Eventric.context('TestContext')
    context.defineDomainEvents(TransferEvents)
    context.addAggregate('Transfer', Transfer)
    context.addCommandHandlers(TransferCommands)
    context.initialize()
      .then(() => ET.setupTransferId(context))
      .then(_t => t.end())
      .catch(console.log.bind(console))
  })

  aggregateTest.afterEach(t => {
    sandbox.restore()
    context.destroy()
    t.end()
  })

  aggregateTest.test('PrepareTransfer should', createTest => {
    createTest.test('return transfer', t => {
      let transfer = createTransfer()
      context.command('PrepareTransfer', transfer)
        .then(result => {
          t.equal(result.existing, false)
          compareTransfers(t, result.transfer, transfer)
          t.end()
        })
        .catch(console.log.bind(console))
    })

    createTest.test('return existing transfer if preparing again', t => {
      let transfer = createTransfer()
      context.command('PrepareTransfer', transfer)
      .then(prepared => context.command('PrepareTransfer', transfer))
      .then(result => {
        t.equal(result.existing, true)
        compareTransfers(t, result.transfer, transfer)
        t.end()
      })
      .catch(console.log.bind(console))
    })

    createTest.test('reject if transfer does not equal prepared', t => {
      let transfer = createTransfer()
      P.resolve().then(() => context.command('PrepareTransfer', transfer))
      .then(prepared => {
        let second = createTransfer()
        second.ledger = 'other'
        return context.command('PrepareTransfer', second)
      })
      .then(() => {
        t.fail('Expected exception')
        t.end()
      })
      .catch(AlreadyExistsError, e => {
        console.log(e.name)
        t.equal(e.originalErrorMessage, AlreadyExistsError.prototype.message)
        t.end()
      })
      .catch(e => {
        t.fail('Expected AlreadyExistsError')
        t.end()
      })
    })

    createTest.end()
  })

  aggregateTest.test('FulfillTransfer should', fulfillTest => {
    fulfillTest.test('load and fulfill transfer', t => {
      let transfer = createTransfer()
      let fulfillment = 'cf:0:_v8'
      context.command('PrepareTransfer', transfer)
      .then(() => {
        return context.command('FulfillTransfer', { id: transfer.id, fulfillment })
      })
      .then(fulfilledTransfer => {
        compareTransfers(t, fulfilledTransfer, transfer)
        t.equal(fulfilledTransfer.fulfillment, fulfillment)
        t.end()
      }).catch(console.log.bind(console))
    })

    fulfillTest.test('return previouslyFulfilled transfer', t => {
      let transfer = createTransfer()
      let fulfillment = 'cf:0:_v8'
      context.command('PrepareTransfer', transfer)
      .then(prepared => { return context.command('FulfillTransfer', { id: transfer.id, fulfillment }) })
      .then(f => { return context.command('FulfillTransfer', { id: transfer.id, fulfillment }) })
      .then(fulfilledTransfer => {
        compareTransfers(t, fulfilledTransfer, transfer)
        t.equal(fulfilledTransfer.fulfillment, fulfillment)
        t.equal(fulfilledTransfer.ledger, transfer.ledger)
        t.end()
      })
      .catch(console.log.bind(console))
    })

    fulfillTest.end()
  })
  aggregateTest.end()
})
