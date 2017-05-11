'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Logger = require('@leveloneproject/central-services-shared').Logger
const RequestLogger = require('../../../src/lib/request-logger')

Test('logger', loggerTest => {
  let sandbox

  loggerTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Logger, 'info')

    test.end()
  })

  loggerTest.afterEach(test => {
    sandbox.restore()
    test.end()
  })

  loggerTest.test('request should', requestTest => {
    requestTest.test('send info message to the serviceslogger', test => {
      const request = {
        headers: { traceid: '123456' },
        method: 'post',
        url: { path: '/accounts' },
        query: { token: '1234' },
        body: 'this is the body'
      }
      RequestLogger.logRequest(request)
      const args = Logger.info.firstCall.args
      const args2 = Logger.info.secondCall.args
      const args3 = Logger.info.thirdCall.args
      test.equal(args[0], `L1p-Trace-Id=${request.headers.traceid} - Method: ${request.method} Path: ${request.url.path} Query: ${JSON.stringify(request.query)}`)
      test.equal(args2[0], `L1p-Trace-Id=${request.headers.traceid} - Headers: ${JSON.stringify(request.headers)}`)
      test.equal(args3[0], `L1p-Trace-Id=${request.headers.traceid} - Body: ${request.body}`)
      test.end()
    })
    requestTest.end()
  })

  loggerTest.test('response should', responseTest => {
    responseTest.test('send info message to the serviceslogger', test => {
      const request = {
        headers: { traceid: '123456' },
        response: 'this is the response'
      }
      RequestLogger.logResponse(request)
      const args = Logger.info.firstCall.args
      test.equal(args[0], `L1p-Trace-Id=${request.headers.traceid} - Response: ${request.response}`)
      test.end()
    })

    responseTest.test('not send info message to the serviceslogger', test => {
      const request = {
        headers: { traceid: '123456' }
      }
      RequestLogger.logResponse(request)
      test.notOk(Logger.info.called)
      test.end()
    })
    responseTest.end()
  })

  loggerTest.end()
})
