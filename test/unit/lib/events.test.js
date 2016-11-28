'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const TransferTranslator = require('../../../src/adapters/transfer-translator')
const EventsPath = '../../../src/lib/events'

Test('events', eventTest => {
  let sandbox

  eventTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(TransferTranslator, 'toTransfer')
    t.end()
  })

  eventTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  eventTest.test('emitTransferPrepared should', function (emitTest) {
    emitTest.test('publish transfer prepared event', function (t) {
      let spy = Sinon.spy()
      let Events = require(EventsPath)
      Events.onTransferPrepared(spy)
      let transfer = { id: 12 }
      TransferTranslator.toTransfer.returns(transfer)
      Events.emitTransferPrepared(transfer)
      t.ok(spy.calledWith({ resource: transfer }))
      t.end()
    })

    emitTest.test('not push transfer executed event', function (t) {
      let spy = Sinon.spy()
      let Events = require(EventsPath)
      Events.onTransferExecuted(spy)
      let transfer = { id: 12 }
      TransferTranslator.toTransfer.returns(transfer)
      Events.emitTransferPrepared({})
      t.notOk(spy.called)
      t.end()
    })

    emitTest.test('not push transfer rejected event', function (t) {
      let spy = Sinon.spy()
      let Events = require(EventsPath)
      Events.onTransferRejected(spy)
      let transfer = { id: 12 }
      TransferTranslator.toTransfer.returns(transfer)
      Events.emitTransferPrepared({})
      t.notOk(spy.called)
      t.end()
    })

    emitTest.end()
  })

  eventTest.test('emitTransferExecuted should', function (emitTest) {
    emitTest.test('publish transfer executed event', function (t) {
      let spy = Sinon.spy()
      let Events = require(EventsPath)
      Events.onTransferExecuted(spy)
      let transfer = { id: 12 }
      TransferTranslator.toTransfer.returns(transfer)
      let relatedResources = { execution_condition_fulfillment: 'cf:0:_v8' }
      Events.emitTransferExecuted(transfer, relatedResources)
      t.ok(spy.calledWith({ resource: transfer, related_resources: relatedResources }))
      t.end()
    })

    emitTest.test('not push transfer prepared event', function (t) {
      let spy = Sinon.spy()
      let Events = require(EventsPath)
      Events.onTransferPrepared(spy)
      let transfer = { id: 12 }
      TransferTranslator.toTransfer.returns(transfer)
      Events.emitTransferExecuted({})
      t.notOk(spy.called)
      t.end()
    })

    emitTest.test('not push transfer rejected event', function (t) {
      let spy = Sinon.spy()
      let Events = require(EventsPath)
      Events.onTransferRejected(spy)
      let transfer = { id: 12 }
      TransferTranslator.toTransfer.returns(transfer)
      Events.emitTransferExecuted({})
      t.notOk(spy.called)
      t.end()
    })

    emitTest.end()
  })

  eventTest.test('emitTransferRejected should', function (emitTest) {
    emitTest.test('publish transfer rejected event', function (t) {
      let spy = Sinon.spy()
      let Events = require(EventsPath)
      Events.onTransferRejected(spy)
      let transfer = { id: 12 }
      TransferTranslator.toTransfer.returns(transfer)
      let resource = { id: 12 }
      let relatedResources = { execution_condition_fulfillment: 'cf:0:_v8' }
      Events.emitTransferRejected(resource, relatedResources)
      t.ok(spy.calledWith({ resource: transfer, related_resources: relatedResources }))
      t.end()
    })

    emitTest.test('not push transfer prepared event', function (t) {
      let spy = Sinon.spy()
      let Events = require(EventsPath)
      Events.onTransferPrepared(spy)
      Events.emitTransferRejected({})
      t.notOk(spy.called)
      t.end()
    })

    emitTest.test('not push transfer executed event', function (t) {
      let spy = Sinon.spy()
      let Events = require(EventsPath)
      Events.onTransferExecuted(spy)
      Events.emitTransferRejected({})
      t.notOk(spy.called)
      t.end()
    })

    emitTest.end()
  })
  eventTest.end()
})
