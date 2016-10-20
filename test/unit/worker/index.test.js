'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Config = require('../../../src/lib/config')
const Service = require('../../../src/services/transfer')
const Worker = require('../../../src/worker')

Test('Worker test', workerTest => {
  let sandbox

  workerTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Service, 'rejectExpired')
    sandbox.stub(console, 'error')
    sandbox.stub(console, 'info')
    t.end()
  })

  workerTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  workerTest.test('setup', setupTest => {
    setupTest.beforeEach(t => {
      sandbox.stub(global, 'setInterval')
      sandbox.stub(Worker, 'rejectExpired')
      t.end()
    })

    setupTest.test('should not set timeout when EXPIRES_TIMEOUT config value undefined', test => {
      let next = () => {
        test.equal(global.setInterval.callCount, 0)
        test.end()
      }
      Worker.register({}, {}, next)
    })

    setupTest.test('should setTimeout when EXPIRES_TIMEOUT config value set', test => {
      let expiresTimeout = 1000
      Config.EXPIRES_TIMEOUT = expiresTimeout
      let next = () => {
        test.ok(global.setInterval.calledWith(Worker.rejectExpired, expiresTimeout))
        test.end()
      }

      Worker.register({}, {}, next)
    })

    setupTest.end()
  })

  workerTest.test('run', runTest => {
    let clock

    runTest.beforeEach(t => {
      clock = sandbox.useFakeTimers()
      t.end()
    })

    runTest.afterEach(t => {
      clock.restore()
      t.end()
    })

    runTest.test('should call Service.rejectExpired once and after interval elapse', test => {
      let expiresTimeout = 1000
      sandbox.stub(Worker, 'rejectExpired')
      Worker.rejectExpired.returns(P.resolve([]))
      Config.EXPIRES_TIMEOUT = expiresTimeout
      let next = () => {
        test.equal(Worker.rejectExpired.callCount, 1)
        clock.tick(expiresTimeout)
        test.equal(Worker.rejectExpired.callCount, 2)
        clock.tick(expiresTimeout)
        test.equal(Worker.rejectExpired.callCount, 3)
        test.end()
      }
      Worker.register({}, {}, next)
    })

    runTest.end()
  })

  workerTest.test('rejectExpired should', rejectTest => {
    rejectTest.test('call Service.rejectExpired and log results', test => {
      let expiredTransfers = [1, 2]
      Service.rejectExpired.returns(P.resolve(expiredTransfers))

      Worker.rejectExpired().then(result => {
        test.equal(result, expiredTransfers)
        test.ok(console.info.calledWith(`Rejected transfers: ${result}`))
        test.ok(console.error.notCalled)
        test.end()
      })
    })

    rejectTest.test('call Service.rejectExpired and log error if thrown', test => {
      let error = new Error()
      Service.rejectExpired.returns(P.reject(error))

      Worker.rejectExpired().then(result => {
        test.notOk(result)
        test.ok(console.error.calledWith('Error rejecting transfers', error))
        test.ok(console.info.notCalled)
        test.end()
      })
    })

    rejectTest.end()
  })

  workerTest.end()
})
