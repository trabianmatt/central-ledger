'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Logger = require('@leveloneproject/central-services-shared').Logger
const Config = require(`${src}/lib/config`)
const TransferService = require(`${src}/domain/transfer`)
const TokenService = require(`${src}/domain/token`)
const Worker = require(`${src}/api/worker`)

Test('Worker test', workerTest => {
  let sandbox

  workerTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(TransferService, 'rejectExpired')
    sandbox.stub(TokenService, 'removeExpired')
    sandbox.stub(Logger, 'error')
    sandbox.stub(Logger, 'info')
    t.end()
  })

  workerTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  workerTest.test('setup', setupTest => {
    setupTest.beforeEach(t => {
      sandbox.stub(global, 'setInterval')
      sandbox.stub(Worker, 'rejectExpiredTransfers')
      sandbox.stub(Worker, 'rejectExpiredTokens')
      t.end()
    })

    setupTest.test('should not set timeout when EXPIRES_TIMEOUT config value undefined', test => {
      let expiresTimeout = 1000
      Config.TOKEN_EXPIRATION = null
      let next = () => {
        test.notOk(global.setInterval.calledWith(Worker.rejectExpiredTransfers, expiresTimeout))
        test.end()
      }
      Worker.register({}, {}, next)
    })

    setupTest.test('should setTimeout when EXPIRES_TIMEOUT config value set', test => {
      let expiresTimeout = 1000
      Config.EXPIRES_TIMEOUT = expiresTimeout
      let next = () => {
        test.ok(global.setInterval.calledWith(Worker.rejectExpiredTransfers, expiresTimeout))
        test.end()
      }

      Worker.register({}, {}, next)
    })

    setupTest.test('should not set tokenExpiration when TOKEN_EXPIRATION config value undefined', test => {
      let tokenExpiration = 1000
      Config.TOKEN_EXPIRATION = null
      let next = () => {
        test.notOk(global.setInterval.calledWith(Worker.rejectExpiredTokens, tokenExpiration))
        test.end()
      }
      Worker.register({}, {}, next)
    })

    setupTest.test('should set tokenExpiration when TOKEN_EXPIRATION config value set', test => {
      let tokenExpiration = 1000
      Config.TOKEN_EXPIRATION = tokenExpiration
      let next = () => {
        test.ok(global.setInterval.calledWith(Worker.rejectExpiredTokens, tokenExpiration))
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

    runTest.test('should call Worker.rejectExpiredTransfers after interval elapse', test => {
      let expiresTimeout = 1000
      sandbox.stub(Worker, 'rejectExpiredTransfers')
      Worker.rejectExpiredTransfers.returns(P.resolve([]))
      Config.EXPIRES_TIMEOUT = expiresTimeout
      Config.TOKEN_EXPIRATION = null
      let next = () => {
        test.notOk(Worker.rejectExpiredTransfers.called)
        clock.tick(expiresTimeout)
        test.ok(Worker.rejectExpiredTransfers.calledOnce)
        clock.tick(expiresTimeout)
        test.ok(Worker.rejectExpiredTransfers.calledTwice)
        test.end()
      }
      Worker.register({}, {}, next)
    })

    runTest.test('should call Worker.rejectExpiredTokens after interval elapse', test => {
      let tokenExpiration = 1000
      sandbox.stub(Worker, 'rejectExpiredTokens')
      Worker.rejectExpiredTokens.returns(P.resolve([]))
      Config.EXPIRES_TIMEOUT = null
      Config.TOKEN_EXPIRATION = tokenExpiration
      let next = () => {
        test.notOk(Worker.rejectExpiredTokens.called)
        clock.tick(tokenExpiration)
        test.ok(Worker.rejectExpiredTokens.calledOnce)
        clock.tick(tokenExpiration)
        test.ok(Worker.rejectExpiredTokens.calledTwice)
        test.end()
      }
      Worker.register({}, {}, next)
    })

    runTest.end()
  })

  workerTest.test('rejectExpiredTransfers should', rejectTest => {
    rejectTest.test('call TransferService.rejectExpired and log results', test => {
      let expiredTransfers = [1, 2]
      TransferService.rejectExpired.returns(P.resolve(expiredTransfers))

      Worker.rejectExpiredTransfers().then(result => {
        test.equal(result, expiredTransfers)
        test.ok(Logger.info.calledWith(`Rejected transfers: ${result}`))
        test.ok(Logger.error.notCalled)
        test.end()
      })
    })

    rejectTest.test('call TransferService.rejectExpired and log error if thrown', test => {
      let error = new Error()
      TransferService.rejectExpired.returns(P.reject(error))

      Worker.rejectExpiredTransfers().then(result => {
        test.notOk(result)
        test.ok(Logger.error.calledWith('Error rejecting transfers', error))
        test.ok(Logger.info.notCalled)
        test.end()
      })
    })

    rejectTest.end()
  })

  workerTest.test('rejectExpiredTokens should', rejectTest => {
    rejectTest.test('call TokenService.removeExpired and log results', test => {
      let expiredTokens = [1, 2]
      TokenService.removeExpired.returns(P.resolve(expiredTokens))

      Worker.rejectExpiredTokens().then(result => {
        test.equal(result, expiredTokens)
        test.ok(Logger.info.calledWith(`Rejected tokens: ${result}`))
        test.ok(Logger.error.notCalled)
        test.end()
      })
    })

    rejectTest.test('call TokenService.removeExpired and log error if thrown', test => {
      let error = new Error()
      TokenService.removeExpired.returns(P.reject(error))

      Worker.rejectExpiredTokens().then(result => {
        test.notOk(result)
        test.ok(Logger.error.calledWith('Error rejecting tokens', error))
        test.ok(Logger.info.notCalled)
        test.end()
      })
    })

    rejectTest.end()
  })

  workerTest.end()
})
