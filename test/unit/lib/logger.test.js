'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const ServicesLogger = require('@leveloneproject/central-services-shared').Logger
const Proxyquire = require('proxyquire')

Test('logger', loggerTest => {
  let sandbox
  let Logger

  loggerTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(ServicesLogger, 'debug')
    sandbox.stub(ServicesLogger, 'info')
    sandbox.stub(ServicesLogger, 'warn')
    sandbox.stub(ServicesLogger, 'error')

    let cls = { getNamespace: sandbox.stub() }
    let ns = sandbox.stub()
    ns.get = sandbox.stub()
    ns.get.returns({ traceid: '12345' })

    cls.getNamespace.returns(ns)

    Logger = Proxyquire('../../../src/lib/logger', { 'continuation-local-storage': cls })

    test.end()
  })

  loggerTest.afterEach(test => {
    sandbox.restore()
    test.end()
  })

  loggerTest.test('new logger should', createTest => {
    createTest.test('create a new logger', test => {
      Logger.debug('the message', 'args')
      const args = ServicesLogger.debug.firstCall.args
      test.ok(ServicesLogger.debug.calledWith('L1P_TRACE_ID=12345 - the message', 'args'))
      test.equal(args[0], 'L1P_TRACE_ID=12345 - the message')
      test.equal(args[1], 'args')
      test.end()
    })
    createTest.end()
  })

  loggerTest.test('debug should', debugTest => {
    debugTest.test('send debug message to the serviceslogger', test => {
      Logger.debug('the message', 'args')
      const args = ServicesLogger.debug.firstCall.args
      test.ok(ServicesLogger.debug.calledWith('L1P_TRACE_ID=12345 - the message', 'args'))
      test.equal(args[0], 'L1P_TRACE_ID=12345 - the message')
      test.equal(args[1], 'args')
      test.end()
    })
    debugTest.end()
  })

  loggerTest.test('info should', infoTest => {
    infoTest.test('send info message to the serviceslogger', test => {
      Logger.info('the message', 'args')
      const args = ServicesLogger.info.firstCall.args
      test.ok(ServicesLogger.info.calledWith('L1P_TRACE_ID=12345 - the message', 'args'))
      test.equal(args[0], 'L1P_TRACE_ID=12345 - the message')
      test.equal(args[1], 'args')
      test.end()
    })
    infoTest.end()
  })

  loggerTest.test('error should', errorTest => {
    errorTest.test('send error message to the serviceslogger', test => {
      Logger.error('the message', 'args')
      const args = ServicesLogger.error.firstCall.args
      test.ok(ServicesLogger.error.calledWith('L1P_TRACE_ID=12345 - the message', 'args'))
      test.equal(args[0], 'L1P_TRACE_ID=12345 - the message')
      test.equal(args[1], 'args')
      test.end()
    })
    errorTest.end()
  })

  loggerTest.test('warn should', warnTest => {
    warnTest.test('send warn message to the serviceslogger', test => {
      Logger.warn('the message', 'args')
      const args = ServicesLogger.warn.firstCall.args
      test.ok(ServicesLogger.warn.calledWith('L1P_TRACE_ID=12345 - the message', 'args'))
      test.equal(args[0], 'L1P_TRACE_ID=12345 - the message')
      test.equal(args[1], 'args')
      test.end()
    })
    warnTest.end()
  })

  loggerTest.test('generateTraceIdMessage should', traceIdTest => {
    traceIdTest.test('return an empty string if undefined', test => {
      let cls = { getNamespace: sandbox.stub() }
      cls.getNamespace.returns(undefined)

      Logger = Proxyquire('../../../src/lib/logger', { 'continuation-local-storage': cls })
      Logger.warn('the message', 'args')
      const args = ServicesLogger.warn.firstCall.args
      test.ok(ServicesLogger.warn.calledWith('the message', 'args'))
      test.equal(args[0], 'the message')
      test.equal(args[1], 'args')
      test.end()
    })
    traceIdTest.end()
  })

  loggerTest.end()
})
