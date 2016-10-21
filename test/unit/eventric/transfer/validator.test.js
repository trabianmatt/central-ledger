'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Moment = require('moment')
const _ = require('lodash')
const Validator = require(`${src}/eventric/transfer/validator`)
const TransferState = require(`${src}/eventric/transfer/state`)
const UnpreparedTransferError = require(`${src}/errors/unprepared-transfer-error`)
const CryptoFulfillments = require(`${src}/crypto-conditions/fulfillments`)
const AlreadyExistsError = require(`${src}/errors/already-exists-error`)

Test('validator tests', validatorTest => {
  let sandbox
  let clock
  let now = Moment('2016-06-16T00:00:01.000Z')

  validatorTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(CryptoFulfillments, 'validateConditionFulfillment')

    clock = Sinon.useFakeTimers(now.unix())
    t.end()
  })

  validatorTest.afterEach(t => {
    sandbox.restore()
    clock.restore()
    t.end()
  })

  validatorTest.test('validateFulfillment should', fulfillmentTest => {
    fulfillmentTest.test('return previouslyFulfilled if transfer is Executed and fulfillment is the same', t => {
      let fulfillment = 'test-fulfillment'
      let transfer = {
        state: TransferState.EXECUTED,
        fulfillment,
        expires_at: now.clone().add(1, 'hour').unix()
      }

      Validator.validateFulfillment(transfer, fulfillment)
      .then(result => {
        t.equal(result.previouslyFulfilled, true)
        t.end()
      })
    })

    fulfillmentTest.test('throw UnpreparedTransferError if transfer is not prepared', t => {
      let transfer = {
        state: TransferState.EXECUTED,
        expires_at: now.clone().add(1, 'hour').unix()
      }

      Validator.validateFulfillment(transfer, 'test-fulfillment')
      .then(() => {
        t.fail('Expected exception')
        t.end()
      })
      .catch(UnpreparedTransferError, e => {
        t.ok(e instanceof UnpreparedTransferError)
        t.end()
      })
    })

    fulfillmentTest.test('throw error if validateFulfillmentCondition throw', t => {
      let error = new Error()
      let fulfillment = 'fulfillment'
      let executionCondition = 'execution_condition'
      CryptoFulfillments.validateConditionFulfillment.withArgs(executionCondition, fulfillment).throws(error)
      let transfer = {
        state: TransferState.PREPARED,
        execution_condition: executionCondition,
        expires_at: now.clone().add(1, 'hour').unix()
      }

      Validator.validateFulfillment(transfer, fulfillment)
      .then(() => {
        t.fail('Expected exception')
        t.end()
      })
      .catch(e => {
        t.equal(e, error)
        t.end()
      })
    })

    fulfillmentTest.test('return not previouslyFulfilled if transfer passes all checks', t => {
      CryptoFulfillments.validateConditionFulfillment.returns(true)
      let transfer = {
        state: TransferState.PREPARED,
        expires_at: now.clone().add(1, 'hour').unix()
      }

      Validator.validateFulfillment(transfer, 'fulfillment')
      .then(result => {
        t.equal(result.previouslyFulfilled, false)
        t.end()
      })
    })

    fulfillmentTest.test('throw error if current time is greater than expired_at', t => {
      CryptoFulfillments.validateConditionFulfillment.returns(true)

      let transfer = {
        state: TransferState.PREPARED,
        expires_at: now.clone().subtract(1, 'hour').unix()
      }

      Validator.validateFulfillment(transfer, 'fulfillment')
      .then(result => {
        t.fail('Expected exception')
        t.end()
      })
      .catch(e => {
        t.equal(e.name, 'ExpiredTransferError')
        t.end()
      })
    })

    fulfillmentTest.end()
  })

  validatorTest.test('validateExistingOnPrepare should', existingPrepareTest => {
    let assertAlreadyExistsError = (t, proposed, existing) => {
      Validator.validateExistingOnPrepare(proposed, existing)
      .then(() => {
        t.fail('Expected exception')
        t.end()
      })
      .catch(AlreadyExistsError, e => {
        t.equal(e.message, 'The specified entity already exists and may not be modified.')
        t.end()
      })
      .catch(() => {
        t.fail('Expected AlreadyExistsError')
        t.end()
      })
    }

    existingPrepareTest.test('reject if proposed does not equal existing', t => {
      let proposed = {
        id: 'https://central-ledger/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204',
        ledger: 'http://usd-ledger.example/USD',
        debits: [
          {
            account: 'http://usd-ledger.example/USD/accounts/alice',
            amount: '50'
          }
        ],
        credits: [
          {
            account: 'http://usd-ledger.example/USD/accounts/bob',
            amount: '50'
          }
        ],
        execution_condition: 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2',
        expires_at: '2015-06-16T00:00:01.000Z'
      }
      let existing = _.omit(proposed, ['debits'])
      existing.state = TransferState.PREPARED

      assertAlreadyExistsError(t, proposed, _.omit(proposed, ['debits']))
    })

    existingPrepareTest.test('return existing if existing matches proposed', t => {
      let proposed = {
        id: 'https://central-ledger/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204',
        ledger: 'http://usd-ledger.example/USD',
        debits: [
          {
            account: 'http://usd-ledger.example/USD/accounts/alice',
            amount: '50'
          }
        ],
        credits: [
          {
            account: 'http://usd-ledger.example/USD/accounts/bob',
            amount: '50'
          }
        ],
        execution_condition: 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2',
        expires_at: '2015-06-16T00:00:01.000Z'
      }
      let existing = {
        id: 'https://central-ledger/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204',
        ledger: 'http://usd-ledger.example/USD',
        debits: [
          {
            account: 'http://usd-ledger.example/USD/accounts/alice',
            amount: '50'
          }
        ],
        credits: [
          {
            account: 'http://usd-ledger.example/USD/accounts/bob',
            amount: '50'
          }
        ],
        execution_condition: 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2',
        expires_at: '2015-06-16T00:00:01.000Z',
        state: TransferState.PREPARED,
        $save: () => {},
        $setIdOnCreation: () => {}
      }

      Validator.validateExistingOnPrepare(proposed, existing)
      .then(result => {
        t.equal(result, existing)
        t.end()
      })
    })

    existingPrepareTest.test('not match id', t => {
      let proposed = {
        id: 'https://central-ledger/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204',
        ledger: 'http://usd-ledger.example/USD',
        debits: [
          {
            account: 'http://usd-ledger.example/USD/accounts/alice',
            amount: '50'
          }
        ],
        credits: [
          {
            account: 'http://usd-ledger.example/USD/accounts/bob',
            amount: '50'
          }
        ],
        execution_condition: 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2',
        expires_at: '2015-06-16T00:00:01.000Z'
      }
      let existing = {
        ledger: 'http://usd-ledger.example/USD',
        debits: [
          {
            account: 'http://usd-ledger.example/USD/accounts/alice',
            amount: '50'
          }
        ],
        credits: [
          {
            account: 'http://usd-ledger.example/USD/accounts/bob',
            amount: '50'
          }
        ],
        execution_condition: 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2',
        expires_at: '2015-06-16T00:00:01.000Z',
        state: TransferState.PREPARED,
        $save: () => {},
        $setIdOnCreation: () => {}
      }

      Validator.validateExistingOnPrepare(proposed, existing)
      .then(result => {
        t.equal(result, existing)
        t.end()
      })
    })

    existingPrepareTest.test('throw error when existing is not prepared', t => {
      let proposed = {}
      let existing = {
        state: TransferState.EXECUTED
      }

      assertAlreadyExistsError(t, proposed, existing)
    })

    existingPrepareTest.end()
  })

  validatorTest.test('validateReject should', rejectTest => {
    rejectTest.test('return alreadyRejected if state is rejected and any credit has the same message', t => {
      let rejectionReason = 'r-e-j-e-c-t find out what it means to me'
      let transfer = {
        state: TransferState.REJECTED,
        credits: [
          { rejection_message: rejectionReason }
        ]
      }

      Validator.validateReject(transfer, rejectionReason)
      .then(result => {
        t.equal(result.alreadyRejected, true)
        t.end()
      })
    })

    rejectTest.test('throw UnpreparedTransferError is state is not prepared', t => {
      let rejectionReason = 'Dear John,'
      let transfer = {
        state: TransferState.REJECTED,
        rejection_reason: 'not ' + rejectionReason
      }

      Validator.validateReject(transfer, rejectionReason)
      .then(() => {
        t.fail('Expected exception to be thrown')
        t.end()
      }).catch(UnpreparedTransferError, e => {
        t.pass()
        t.end()
      }).catch(e => {
        t.fail(e.message)
        t.end()
      })
    })

    rejectTest.test('return alreadyReject false if all transfer is not rejected', t => {
      let rejectionReason = "It's not you, it's me"
      let transfer = {
        state: TransferState.PREPARED
      }

      Validator.validateReject(transfer, rejectionReason)
      .then(result => {
        t.equal(result.alreadyRejected, false)
        t.end()
      })
      .catch(e => {
        t.fail(e.message)
        t.end()
      })
    })
    rejectTest.end()
  })

  validatorTest.end()
})
