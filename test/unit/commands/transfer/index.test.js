'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Uuid = require('uuid4')
const Eventric = require('../../../../src/eventric')
const Transfer = require('../../../../src/commands/transfer')
const RejectionType = require('../../../../src/domain/transfer/rejection-type')

Test('Eventric Transfer index test', indexTest => {
  let sandbox

  indexTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Eventric, 'getContext')
    t.end()
  })

  indexTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  indexTest.test('prepare should', prepareTest => {
    prepareTest.test('execute prepare command on context', t => {
      let command = sandbox.stub()
      let expected = {}
      command.returns(expected)
      Eventric.getContext.returns(P.resolve({ command: command }))

      let payload = {}

      Transfer.prepare(payload)
      .then(tfr => {
        t.ok(command.calledWith('PrepareTransfer', payload))
        t.equal(tfr, expected)
        t.end()
      })
    })

    prepareTest.end()
  })

  indexTest.test('fulfill should', fulfillTest => {
    fulfillTest.test('execute fulfill command on context', t => {
      let command = sandbox.stub()
      let expected = {}
      command.returns(expected)
      Eventric.getContext.returns(P.resolve({ command: command }))

      let payload = {}
      Transfer.fulfill(payload)
      .then(result => {
        t.ok(command.calledWith('FulfillTransfer', payload))
        t.equal(result, expected)
        t.end()
      })
    })
    fulfillTest.end()
  })

  indexTest.test('reject should', rejectTest => {
    rejectTest.test('execute reject command type CANCELED on context', t => {
      let command = sandbox.stub()
      let expected = {}
      command.returns(expected)
      Eventric.getContext.returns(P.resolve({ command: command }))

      let rejection = { id: Uuid(), rejection_reason: 'another excuse' }
      Transfer.reject(rejection)
      .then(result => {
        t.ok(command.calledWith('RejectTransfer', Sinon.match({ id: rejection.id, rejection_reason: rejection.rejection_reason })))
        t.equal(result, expected)
        t.end()
      })
    })
    rejectTest.end()
  })

  indexTest.test('expire should', rejectTest => {
    rejectTest.test('execute reject command type EXPIRED on context', t => {
      let command = sandbox.stub()
      let expected = {}
      command.returns(expected)
      Eventric.getContext.returns(P.resolve({ command: command }))
      let transferId = Uuid()
      Transfer.expire(transferId)
      .then(result => {
        t.ok(command.calledWith('RejectTransfer', Sinon.match({ id: transferId, rejection_reason: RejectionType.EXPIRED })))
        t.equal(result, expected)
        t.end()
      })
    })
    rejectTest.end()
  })

  indexTest.test('settle should', settleTest => {
    settleTest.test('execute settle command on context', t => {
      let command = sandbox.stub()
      let expected = {}
      command.returns(expected)
      Eventric.getContext.returns(P.resolve({ command: command }))
      let payload = {id: Uuid(), settlement_id: Uuid()}
      Transfer.settle(payload)
      .then(result => {
        t.ok(command.calledWith('SettleTransfer', Sinon.match(payload)))
        t.equal(result, expected)
        t.end()
      })
    })
    settleTest.end()
  })

  indexTest.end()
})
