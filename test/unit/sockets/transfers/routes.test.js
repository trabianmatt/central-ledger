'use strict'

const Tape = require('tape')
const Tapes = require('tapes')
const Test = Tapes(Tape)
const Sinon = require('sinon')
const Any = require('@travi/any')
const RoutesPath = '../../../../src/sockets/transfers/routes'
const events = require('../../../../src/lib/events')
const routes = require(RoutesPath)

Test('routes', function (routesTest) {
  let sandbox

  routesTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(events, 'onTransferPrepared')
    sandbox.stub(events, 'onTransferExecuted')
    t.end()
  })

  routesTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  routesTest.test('setup server', function (serverTest) {
    var serverStub = {
      subscription: Sinon.spy()
    }

    routes(serverStub)

    serverTest.ok(serverStub.subscription.calledOnce)
    serverTest.end()
  })

  routesTest.test('setup transfer prepared listeners', function (serverTest) {
    var serverStub = {
      subscription: Sinon.stub(),
      publish: Sinon.stub()
    }
    var transfer = Any.simpleObject()

    events.onTransferPrepared.yields(transfer)

    routes(serverStub)

    serverTest.ok(serverStub.publish.calledWith('/transfers/updates', transfer))
    serverTest.end()
  })

  routesTest.test('setup transfer fulfilled listeners', function (serverTest) {
    var serverStub = {
      subscription: Sinon.stub(),
      publish: Sinon.stub()
    }
    var transfer = Any.simpleObject()

    events.onTransferExecuted.yields(transfer)

    routes(serverStub)

    serverTest.ok(serverStub.publish.calledWith('/transfers/updates', transfer))
    serverTest.end()
  })

  routesTest.end()
})
