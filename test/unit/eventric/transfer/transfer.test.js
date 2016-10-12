'use strict'

const Sinon = require('sinon')
const Test = require('tapes')(require('tape'))
const TransferState = require('../../../../src/eventric/transfer/transfer-state')
const Transfer = require('../../../../src/eventric/transfer/transfer')
const CryptoConditions = require('../../../../src/cryptoConditions/conditions')

Test('transfer', function (transferTest) {
  let sandbox

  transferTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(CryptoConditions, 'validateCondition')
    t.end()
  })

  transferTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  transferTest.test('create should', function (createTransferTest) {
    createTransferTest.test('emit TransferPrepared event', function (assert) {
      CryptoConditions.validateCondition.returns(true)

      let transfer = new Transfer()

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
      CryptoConditions.validateCondition.throws()

      let transfer = new Transfer()

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
      let transfer = new Transfer()
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

    fulfillTransferTest.end()
  })

  transferTest.test('handleTransferPrepared should', handleTransferPreparedTest => {
    handleTransferPreparedTest.test('set transfer properties', t => {
      let transfer = new Transfer()
      let event = {
        payload: {
          ledger: 'ledger',
          debits: 'debits',
          credits: 'credits',
          execution_condition: 'execution_condition',
          expires_at: 'expires_at'
        }
      }
      transfer.handleTransferPrepared(event)
      t.equal(transfer.ledger, 'ledger')
      t.equal(transfer.debits, 'debits')
      t.equal(transfer.credits, 'credits')
      t.equal(transfer.execution_condition, 'execution_condition')
      t.equal(transfer.expires_at, 'expires_at')
      t.equal(transfer.state, TransferState.PREPARED)
      t.end()
    })

    handleTransferPreparedTest.end()
  })

  transferTest.test('handleTransferExecuted should', handleTest => {
    handleTest.test('set transfer properties', t => {
      let transfer = new Transfer()
      let fulfillment = 'test'
      t.notOk(transfer.state)
      t.notOk(transfer.fulfillment)

      transfer.handleTransferExecuted({
        payload: {
          fulfillment: fulfillment
        }
      })

      t.equal(transfer.state, TransferState.EXECUTED)
      t.equal(transfer.fulfillment, fulfillment)
      t.end()
    })
    handleTest.end()
  })

  transferTest.end()
})
