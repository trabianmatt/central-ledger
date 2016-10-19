'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Model = require(`${src}/api/transfers/model`)
const Eventric = require(`${src}/eventric`)
const Transfer = require(`${src}/commands/transfer`)
const Events = require(`${src}/lib/events`)
const UrlParser = require(`${src}/lib/urlparser`)

let createTransfer = (transferId = '3a2a1d9e-8640-4d2d-b06c-84f2cd613204') => {
  return {
    id: `https://central-ledger/transfers/${transferId}`,
    ledger: 'ledger',
    credits: [],
    debits: [],
    execution_condition: '',
    expires_at: ''
  }
}

Test('transfer model', function (modelTest) {
  let sandbox

  modelTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Eventric, 'getContext')
    sandbox.stub(UrlParser, 'idFromTransferUri')
    sandbox.stub(UrlParser, 'toTransferUri')
    sandbox.stub(Transfer, 'prepare')
    sandbox.stub(Transfer, 'fulfill')
    sandbox.stub(Transfer, 'reject')
    sandbox.stub(Events, 'emitTransferPrepared')
    sandbox.stub(Events, 'emitTransferExecuted')
    t.end()
  })

  modelTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  modelTest.test('prepare should', function (prepareTest) {
    prepareTest.test('Call Transfer prepare function', function (assert) {
      let transferId = '3a2a1d9e-8640-4d2d-b06c-84f2cd613204'
      let payload = createTransfer(transferId)
      UrlParser.idFromTransferUri.withArgs(payload.id).returns(transferId)
      UrlParser.toTransferUri.withArgs(transferId).returns(payload.id)
      let expected = {
        existing: false,
        transfer: {
          id: transferId,
          ledger: payload.ledger,
          credits: payload.credits,
          debits: payload.debits,
          execution_condition: payload.execution_condition,
          expires_at: payload.expires_at
        }
      }
      Transfer.prepare.returns(P.resolve(expected))

      Model.prepare(payload)
        .then(result => {
          let args = Transfer.prepare.firstCall.args
          assert.equal(args[0].id, transferId)
          assert.equal(result.id, payload.id)
          assert.equal(result.existing, expected.existing)
          assert.equal(result.ledger, expected.transfer.ledger)
          assert.equal(result.credits, expected.transfer.credits)
          assert.equal(result.debits, expected.transfer.debits)
          assert.equal(result.execution_condition, expected.transfer.execution_condition)
          assert.equal(result.expires_at, expected.transfer.expires_at)
          assert.end()
        })
    })

    prepareTest.test('Emit transfer prepared event', t => {
      let transferId = '3a2a1d9e-8640-4d2d-b06c-84f2cd613204'
      let payload = createTransfer(transferId)
      UrlParser.idFromTransferUri.withArgs(payload.id).returns(transferId)
      UrlParser.toTransferUri.withArgs(transferId).returns(payload.id)
      let expected = {
        existing: false,
        transfer: {
          id: transferId,
          ledger: payload.ledger,
          credits: payload.credits,
          debits: payload.debits,
          execution_condition: payload.execution_condition,
          expires_at: payload.expires_at
        }
      }
      Transfer.prepare.returns(P.resolve(expected))
      Model.prepare(payload)
      .then(result => {
        let emitArgs = Events.emitTransferPrepared.firstCall.args[0]
        t.equal(emitArgs.id, payload.id)
        t.equal(emitArgs.ledger, payload.ledger)
        t.equal(emitArgs.credits, payload.credits)
        t.equal(emitArgs.debits, payload.debits)
        t.equal(emitArgs.execution_condition, payload.execution_condition)
        t.equal(emitArgs.expires_at, payload.expires_at)
        t.equal(emitArgs.timeline, payload.timeline)
        t.end()
      })
    })

    prepareTest.end()
  })

  modelTest.test('fulfill should', function (fulfillTest) {
    fulfillTest.test('Call Transfer fulfill method', function (assert) {
      let fulfillment = 'cf:0:_v8'
      let payload = { id: '3a2a1d9e-8640-4d2d-b06c-84f2cd613204', fulfillment }
      let transfer = createTransfer()
      Transfer.fulfill.withArgs(payload).returns(P.resolve(transfer))
      Model.fulfill(payload)
        .then(result => {
          assert.equal(result, fulfillment)
          assert.ok(Transfer.fulfill.calledWith(payload))
          assert.end()
        })
    })

    fulfillTest.test('Emit transfer executed event', t => {
      let fulfillment = 'cf:0:_v8'
      let transferId = '3a2a1d9e-8640-4d2d-b06c-84f2cd613204'
      let expandedId = 'http://central-ledger/transfers/' + transferId
      UrlParser.toTransferUri.withArgs(transferId).returns(expandedId)
      let payload = { id: transferId, fulfillment }
      let transfer = createTransfer(transferId)
      transfer.id = transferId
      Transfer.fulfill.withArgs(payload).returns(P.resolve(transfer))
      Model.fulfill(payload)
        .then(result => {
          let emitArgs = Events.emitTransferExecuted.firstCall.args
          let args0 = emitArgs[0]
          t.equal(args0.id, expandedId)
          let args1 = emitArgs[1]
          t.equal(args1.execution_condition_fulfillment, fulfillment)
          t.end()
        })
    })

    fulfillTest.end()
  })

  modelTest.test('reject should', rejectTest => {
    rejectTest.test('send RejectTransfer command', t => {
      let rejectionReason = 'some reason'
      let payload = { id: '3a2a1d9e-8640-4d2d-b06c-84f2cd613204', rejection_reason: rejectionReason }
      let transfer = createTransfer()
      Transfer.reject.withArgs(payload).returns(P.resolve({ transfer, rejection_reason: rejectionReason }))

      Model.reject(payload)
        .then(result => {
          t.equal(result, rejectionReason)
          t.ok(Transfer.reject.calledWith(payload))
          t.end()
        })
    })
    rejectTest.end()
  })

  modelTest.end()
})
