const Test = require('tape')
const Sinon = require('sinon')
const EventsPath = '../../../src/lib/events'

Test('events', function (eventTest) {
  eventTest.test('emitTransferPrepared should', function (emitTest) {
    emitTest.test('publish transfer prepared event', function (t) {
      var spy = Sinon.spy()
      var Events = require(EventsPath)
      Events.onTransferPrepared(spy)
      var transfer = { id: 12 }
      Events.emitTransferPrepared(transfer)
      t.ok(spy.calledWith(transfer))
      t.end()
    })

    emitTest.test('not push transfer fulfilled event', function (t) {
      var spy = Sinon.spy()
      var Events = require(EventsPath)
      Events.onTransferFulfilled(spy)
      Events.emitTransferPrepared({})
      t.notOk(spy.called)
      t.end()
    })
    emitTest.end()
  })

  eventTest.test('emitTransferFulfilled should', function (emitTest) {
    emitTest.test('publish transfer fulfilled event', function (t) {
      var spy = Sinon.spy()
      var Events = require(EventsPath)
      Events.onTransferFulfilled(spy)
      var transfer = { id: 12 }
      Events.emitTransferFulfilled(transfer)
      t.ok(spy.calledWith(transfer))
      t.end()
    })

    emitTest.test('not push transfer prepared event', function (t) {
      var spy = Sinon.spy()
      var Events = require(EventsPath)
      Events.onTransferPrepared(spy)
      Events.emitTransferFulfilled({})
      t.notOk(spy.called)
      t.end()
    })
    emitTest.end()
  })
  eventTest.end()
})
