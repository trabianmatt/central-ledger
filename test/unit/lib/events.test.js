const Test = require('tape')
const Sinon = require('sinon')
const EventsPath = '../../../src/lib/events'

Test('events', function (eventTest) {
  eventTest.test('emitTransferPrepared should', function (emitTest) {
    emitTest.test('publish transfer prepared event', function (t) {
      let spy = Sinon.spy()
      let Events = require(EventsPath)
      Events.onTransferPrepared(spy)
      let transfer = { id: 12 }
      Events.emitTransferPrepared(transfer)
      t.ok(spy.calledWith({ resource: transfer }))
      t.end()
    })

    emitTest.test('not push transfer executed event', function (t) {
      let spy = Sinon.spy()
      let Events = require(EventsPath)
      Events.onTransferExecuted(spy)
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
      let resource = { id: 12 }
      let relatedResources = { execution_condition_fulfillment: 'cf:0:_v8' }
      Events.emitTransferExecuted(resource, relatedResources)
      t.ok(spy.calledWith({ resource: resource, related_resources: relatedResources }))
      t.end()
    })

    emitTest.test('not push transfer prepared event', function (t) {
      let spy = Sinon.spy()
      let Events = require(EventsPath)
      Events.onTransferPrepared(spy)
      Events.emitTransferExecuted({})
      t.notOk(spy.called)
      t.end()
    })
    emitTest.end()
  })
  eventTest.end()
})
