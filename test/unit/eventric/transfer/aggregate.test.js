'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Eventric = require('eventric')
const P = require('bluebird')
const Sinon = require('sinon')
const Moment = require('moment')
const Transfer = require(`${src}/eventric/transfer`)
const TransfersProjection = require(`${src}/eventric/transfer/transfers-projection`)
const SettleableTransfersProjection = require(`${src}/eventric/transfer/settleable-transfers-projection`)
const RejectionType = require(`${src}/domain/transfer/rejection-type`)
const PostgresStore = require(`${src}/eventric/postgres-store`)
const CryptoConditions = require(`${src}/crypto-conditions/conditions`)
const AlreadyExistsError = require(`${src}/errors/already-exists-error`)
const UnpreparedTransferError = require(`${src}/errors/unprepared-transfer-error`)

let now = Moment('2016-06-16T00:00:01.000Z')

let createTransfer = () => {
  return {
    id: 'test',
    ledger: 'ledger',
    debits: [{ amount: 10, account: 'test' }],
    credits: [{ amount: 10, account: 'test' }],
    execution_condition: 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2',
    expires_at: now.clone().add(1, 'hour').toISOString()
  }
}

let compareTransfers = (assert, transfer1, transfer2) => {
  assert.equal(transfer1.id, transfer2.id)
  assert.equal(transfer1.ledger, transfer2.ledger)
  assert.equal(transfer1.debits, transfer2.debits)
  assert.equal(transfer1.credits, transfer2.credits)
  assert.equal(transfer1.execution_condition, transfer2.execution_condition)
  assert.equal(transfer1.expires_at, transfer2.expires_at)
}

Test('Transfer aggregate', aggregateTest => {
  let sandbox
  let context
  let clock

  aggregateTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(CryptoConditions, 'validateCondition')
    sandbox.stub(TransfersProjection)
    sandbox.stub(SettleableTransfersProjection)
    clock = Sinon.useFakeTimers(now.unix())
    TransfersProjection.initialize.yields()
    SettleableTransfersProjection.initialize.yields()
    CryptoConditions.validateCondition.returns(true)
    context = Eventric.context('TestContext')
    PostgresStore.default = {}
    Transfer.setupContext(context)
    context.initialize()
      .then(() => Transfer.onContextInitialized(context))
      .then(_t => t.end())
  })

  aggregateTest.afterEach(t => {
    sandbox.restore()
    clock.restore()
    context.destroy()
    t.end()
  })

  aggregateTest.test('PrepareTransfer should', createTest => {
    createTest.test('return transfer', t => {
      let transfer = createTransfer()
      P.resolve(context.command('PrepareTransfer', transfer))
        .then(result => {
          t.equal(result.existing, false)
          compareTransfers(t, result.transfer, transfer)
          t.end()
        })
        .catch(e => {
          t.fail(e)
          t.end()
        })
    })

    createTest.test('return existing transfer if preparing again', t => {
      let transfer = createTransfer()
      P.resolve(context.command('PrepareTransfer', transfer))
      .then(prepared => context.command('PrepareTransfer', transfer))
      .then(result => {
        t.equal(result.existing, true)
        compareTransfers(t, result.transfer, transfer)
        t.end()
      })
      .catch(e => {
        t.fail(e)
        t.end()
      })
    })

    createTest.test('reject if transfer does not equal prepared', t => {
      let transfer = createTransfer()
      P.resolve(context.command('PrepareTransfer', transfer))
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
      P.resolve(context.command('PrepareTransfer', transfer))
      .then(() => {
        return context.command('FulfillTransfer', { id: transfer.id, fulfillment })
      })
      .then(fulfilledTransfer => {
        compareTransfers(t, fulfilledTransfer, transfer)
        t.equal(fulfilledTransfer.fulfillment, fulfillment)
        t.end()
      }).catch(e => {
        t.fail(e)
        t.end()
      })
    })

    fulfillTest.test('return previouslyFulfilled transfer', t => {
      let transfer = createTransfer()
      let fulfillment = 'cf:0:_v8'
      P.resolve(context.command('PrepareTransfer', transfer))
      .then(prepared => { return context.command('FulfillTransfer', { id: transfer.id, fulfillment }) })
      .then(f => { return context.command('FulfillTransfer', { id: transfer.id, fulfillment }) })
      .then(fulfilledTransfer => {
        compareTransfers(t, fulfilledTransfer, transfer)
        t.equal(fulfilledTransfer.fulfillment, fulfillment)
        t.end()
      })
      .catch(e => {
        t.fail(e)
        t.end()
      })
    })

    fulfillTest.test('throw when fulfilling previously Fulfilled transfer with different condition', t => {
      let transfer = createTransfer()
      let fulfillment = 'cf:0:_v9'
      P.resolve(context.command('PrepareTransfer', transfer))
      .then(prepared => context.command('FulfillTransfer', { id: transfer.id, fulfillment }))
      .then(f => context.command('FulfillTransfer', { id: transfer.id, fulfillment: 'not ' + fulfillment }))
      .then(fulfilledTransfer => {
        t.fail('Expected exception')
        t.end
      })
      .catch(UnpreparedTransferError, e => {
        t.pass()
        t.end()
      })
      .catch(e => {
        t.fail(e)
        t.end()
      })
    })

    fulfillTest.end()
  })

  aggregateTest.test('RejectTransfer should', rejectTest => {
    rejectTest.test('load and reject transfer', t => {
      let originalTransfer = createTransfer()
      let rejectionReason = 'I do not want it'

      P.resolve(context.command('PrepareTransfer', originalTransfer))
      .then(prepared => context.command('RejectTransfer', { id: originalTransfer.id, rejection_reason: rejectionReason }))
      .then(({transfer, rejection_reason}) => {
        compareTransfers(t, transfer, originalTransfer)
        t.equal(rejection_reason, rejectionReason)
        t.equal(transfer.rejection_reason, RejectionType.CANCELED)
        t.end()
      })
      .catch(e => {
        t.fail(e.message)
        t.end()
      })
    })

    rejectTest.test('load and expire transfer', t => {
      let originalTransfer = createTransfer()
      let rejectionReason = 'I do not want it'

      P.resolve(context.command('PrepareTransfer', originalTransfer))
      .then(prepared => context.command('RejectTransfer', { id: originalTransfer.id, rejection_reason: rejectionReason, rejection_type: RejectionType.EXPIRED }))
      .then(({transfer, rejection_reason}) => {
        compareTransfers(t, transfer, originalTransfer)
        t.equal(rejection_reason, rejectionReason)
        t.equal(transfer.rejection_reason, RejectionType.EXPIRED)
        t.end()
      })
      .catch(e => {
        t.fail(e.message)
        t.end()
      })
    })

    rejectTest.test('return existing rejected transfer', t => {
      let originalTransfer = createTransfer()
      let rejectionReason = 'no comment'

      P.resolve(context.command('PrepareTransfer', originalTransfer))
      .then(prepared => context.command('RejectTransfer', { id: originalTransfer.id, rejection_reason: rejectionReason }))
      .then(() => context.command('RejectTransfer', { id: originalTransfer.id, rejection_reason: rejectionReason }))
      .then(({ transfer, rejection_reason }) => {
        compareTransfers(t, transfer, originalTransfer)
        t.equal(rejection_reason, rejectionReason)
        t.equal(transfer.rejection_reason, RejectionType.CANCELED)
        t.end()
      })
      .catch(e => {
        t.fail(e.message)
        t.end()
      })
    })

    rejectTest.test('throw UnpreparedTransferError if rejecting rejected with different reason', t => {
      let originalTransfer = createTransfer()
      let rejectionReason = 'no comment'

      P.resolve(context.command('PrepareTransfer', originalTransfer))
      .then(prepared => context.command('RejectTransfer', { id: originalTransfer.id, rejection_reason: rejectionReason }))
      .then(rejected => context.command('RejectTransfer', { id: originalTransfer.id, rejection_reason: 'not ' + rejectionReason }))
      .then(i => {
        t.fail('Expected exception to be thrown')
        t.end()
      })
      .catch(UnpreparedTransferError, e => {
        t.pass()
        t.end()
      })
      .catch(e => {
        t.fail(e)
        t.end()
      })
    })

    rejectTest.end()
  })

  aggregateTest.end()
})
