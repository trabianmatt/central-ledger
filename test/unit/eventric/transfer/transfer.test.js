'use strict'

const Sinon = require('sinon')
const Test = require('tape')
const Proxyquire = require('proxyquire')
const TransferState = require('../../../../src/eventric/transfer/transferState')

function createTransfer (cryptoConditions, cryptoFulfillments) {
  return Proxyquire('../../../../src/eventric/transfer/transfer',
    {
      '../../cryptoConditions/conditions': cryptoConditions,
      '../../cryptoConditions/fulfillments': cryptoFulfillments
    }
  )
}

Test('transfer', function (transferTest) {
  transferTest.test('create should', function (createTransferTest) {
    createTransferTest.test('emit TransferPrepared event', function (assert) {
      let cryptoConditions = {
        validateCondition: Sinon.stub().returns(true)
      }

      let transfer = new (createTransfer(cryptoConditions, {}))()

      let emitDomainEvent = Sinon.stub()
      transfer.$emitDomainEvent = emitDomainEvent

      let payload = {
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

      transfer.create(payload)

      let emitDomainEventArg1 = emitDomainEvent.firstCall.args[0]
      let emitDomainEventArg2 = emitDomainEvent.firstCall.args[1]
      assert.equal(emitDomainEventArg1, 'TransferPrepared')
      assert.equal(emitDomainEventArg2.ledger, payload.ledger)
      assert.equal(emitDomainEventArg2.debits, payload.debits)
      assert.equal(emitDomainEventArg2.credits, payload.credits)
      assert.equal(emitDomainEventArg2.execution_condition, payload.execution_condition)
      assert.equal(emitDomainEventArg2.expires_at, payload.expires_at)
      assert.end()
    })

    createTransferTest.test('throw an exception if execution condition validation fails', function (assert) {
      let cryptoConditions = {
        validateCondition: Sinon.stub().throws()
      }

      let transfer = new (createTransfer(cryptoConditions, {}))()

      let payload = {
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

      assert.throws(
        () => transfer.create(payload)
      )
      assert.end()
    })

    createTransferTest.end()
  })

  transferTest.test('fulfill should', function (fulfillTransferTest) {
    fulfillTransferTest.test('emit TransferExecuted event', function (assert) {
      let cryptoFulfillments = {
        validateConditionFulfillment: Sinon.stub().returns(true)
      }

      let transfer = new (createTransfer({}, cryptoFulfillments))()
      transfer.execution_condition = 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2'
      transfer.state = TransferState.PREPARED

      let emitDomainEvent = Sinon.stub()
      transfer.$emitDomainEvent = emitDomainEvent

      let fulfillment = 'cf:0:_v8'

      transfer.fulfill({ fulfillment })

      let emitDomainEventArg = emitDomainEvent.firstCall.args[0]
      assert.equal(emitDomainEventArg, 'TransferExecuted')
      assert.end()
    })

    fulfillTransferTest.test('throw exception if not pending', function (assert) {
      let cryptoFulfillments = {
        validateConditionFulfillment: Sinon.stub().returns(true)
      }

      let transfer = new (createTransfer({}, cryptoFulfillments))()
      transfer.execution_condition = 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2'
      transfer.state = null

      let fulfillment = 'cf:0:_v8'

      assert.throws(
        () => transfer.fulfill({ fulfillment }),
        /transfer is not prepared/
      )
      assert.end()
    })

    fulfillTransferTest.test('throw an exception if condition fulfillment validation fails', function (assert) {
      let cryptoFulfillments = {
        validateConditionFulfillment: Sinon.stub().throws()
      }

      let fulfillment = 'cf:0:_v8'
      let transfer = new (createTransfer({}, cryptoFulfillments))()
      transfer.state = TransferState.PREPARED
      transfer.execution_condition = 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2'

      let emitDomainEvent = Sinon.stub()
      transfer.$emitDomainEvent = emitDomainEvent

      assert.throws(
        () => transfer.fulfill({ fulfillment })
      )
      assert.end()
    })

    fulfillTransferTest.end()
  })
  transferTest.end()
})
