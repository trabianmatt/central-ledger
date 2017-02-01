'use strict'

const Sinon = require('sinon')
const Test = require('tapes')(require('tape'))
const Uuid = require('uuid4')
const TransferState = require('../../../../src/domain/transfer/state')
const Transfer = require('../../../../src/eventric/transfer/transfer')
const executionCondition = 'ni:///sha-256;47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU?fpt=preimage-sha-256&cost=0'

Test('transfer', transferTest => {
  transferTest.test('create should', createTransferTest => {
    createTransferTest.test('emit TransferPrepared event', assert => {
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
        execution_condition: executionCondition,
        expires_at: '2015-06-16T00:00:01.000Z'
      }

      transfer.create(payload)

      let emitDomainEventArgs = emitDomainEvent.firstCall.args
      assert.equal(emitDomainEventArgs[0], 'TransferPrepared')
      assert.deepEqual(emitDomainEventArgs[1], payload)
      assert.end()
    })

    createTransferTest.end()
  })

  transferTest.test('fulfill should', fulfillTransferTest => {
    fulfillTransferTest.test('emit TransferExecuted event', assert => {
      let transfer = new Transfer()
      transfer.execution_condition = executionCondition
      transfer.state = TransferState.PREPARED

      let emitDomainEvent = Sinon.stub()
      transfer.$emitDomainEvent = emitDomainEvent

      let fulfillment = 'oAKAAA'

      transfer.fulfill({ fulfillment })

      let emitDomainEventArgs = emitDomainEvent.firstCall.args
      assert.equal(emitDomainEventArgs[0], 'TransferExecuted')
      assert.deepEqual(emitDomainEventArgs[1], { fulfillment: fulfillment })
      assert.end()
    })

    fulfillTransferTest.end()
  })

  transferTest.test('reject should', rejectTest => {
    rejectTest.test('Emit TransferRejected event', t => {
      let transfer = new Transfer()
      let emitDomainEvent = Sinon.stub()
      transfer.$emitDomainEvent = emitDomainEvent

      let rejectionReason = 'something bad happened'

      transfer.reject({ rejection_reason: rejectionReason })

      t.ok(emitDomainEvent.calledWith('TransferRejected', Sinon.match({ rejection_reason: rejectionReason })))
      t.end()
    })
    rejectTest.end()
  })

  transferTest.test('settle should', rejectTest => {
    rejectTest.test('Emit TransferSettled event', t => {
      let transfer = new Transfer()
      let emitDomainEvent = Sinon.stub()
      transfer.$emitDomainEvent = emitDomainEvent

      let settlementId = Uuid()

      transfer.settle({ settlement_id: settlementId })

      t.ok(emitDomainEvent.calledWith('TransferSettled', Sinon.match({ settlement_id: settlementId })))
      t.end()
    })
    rejectTest.end()
  })

  transferTest.test('handleTransferPrepared should', handleTransferPreparedTest => {
    handleTransferPreparedTest.test('set transfer properties', t => {
      let transfer = new Transfer()
      let transferId = Uuid()
      let event = {
        aggregate: {
          id: transferId
        },
        payload: {
          ledger: 'ledger',
          debits: 'debits',
          credits: 'credits',
          execution_condition: 'execution_condition',
          expires_at: 'expires_at'
        },
        timestamp: 1480460976239
      }
      transfer.handleTransferPrepared(event)
      t.equal(transfer.id, transferId)
      t.equal(transfer.ledger, 'ledger')
      t.equal(transfer.debits, 'debits')
      t.equal(transfer.credits, 'credits')
      t.equal(transfer.execution_condition, 'execution_condition')
      t.equal(transfer.expires_at, 'expires_at')
      t.equal(transfer.state, TransferState.PREPARED)
      t.deepEquals(transfer.timeline, { prepared_at: '2016-11-29T23:09:36.239Z' })
      t.end()
    })

    handleTransferPreparedTest.test('set state to EXECUTED if unconditional transfer', t => {
      let transfer = new Transfer()
      let transferId = Uuid()
      let event = {
        aggregate: {
          id: transferId
        },
        payload: {
          ledger: 'ledger',
          debits: 'debits',
          credits: 'credits'
        },
        timestamp: 1480460976239
      }
      transfer.handleTransferPrepared(event)
      t.equal(transfer.id, transferId)
      t.equal(transfer.ledger, 'ledger')
      t.equal(transfer.debits, 'debits')
      t.equal(transfer.credits, 'credits')
      t.notOk(transfer.execution_condition)
      t.notOk(transfer.expires_at)
      t.equal(transfer.state, TransferState.EXECUTED)
      t.deepEquals(transfer.timeline, { prepared_at: '2016-11-29T23:09:36.239Z', executed_at: '2016-11-29T23:09:36.239Z' })
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

      let result = transfer.handleTransferExecuted({
        payload: {
          fulfillment: fulfillment
        }
      })

      t.deepEqual(result, transfer)
      t.equal(transfer.state, TransferState.EXECUTED)
      t.equal(transfer.fulfillment, fulfillment)
      t.end()
    })
    handleTest.end()
  })

  transferTest.test('handleTransferRejected should', handleTest => {
    handleTest.test('set transfer rejection_reason and state and return transfer', t => {
      let transfer = new Transfer()
      let rejectionReason = 'Another bad apple'
      t.notOk(transfer.state)
      t.notOk(transfer.rejection_reason)

      let result = transfer.handleTransferRejected({
        timestamp: new Date().getTime(),
        payload: { rejection_reason: rejectionReason }
      })

      t.deepEqual(result, transfer)
      t.equal(transfer.state, TransferState.REJECTED)
      t.equal(transfer.rejection_reason, rejectionReason)
      t.end()
    })

    handleTest.test('update timeline rejected_at', t => {
      let time = new Date().getTime()
      let transfer = new Transfer()
      let result = transfer.handleTransferRejected({
        timestamp: time,
        payload: { rejection_reason: 'not again' }
      })

      t.equal(result.timeline.rejected_at, new Date(time).toISOString())
      t.end()
    })
    handleTest.end()
  })

  transferTest.test('handleTransferSettled should', handleTest => {
    handleTest.test('set state to settled and return transfer', t => {
      let transfer = new Transfer()
      let settlementId = Uuid()

      let result = transfer.handleTransferSettled({
        timestamp: new Date().getTime(),
        payload: { settlement_id: settlementId }
      })

      t.deepEqual(result, transfer)
      t.equal(transfer.state, TransferState.SETTLED)
      t.equal(transfer.settlement_id, settlementId)
      t.end()
    })
    handleTest.end()
  })

  transferTest.end()
})
