'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Winston = require('winston')
const Logger = require('../../../src/lib/logger')

Test('logger', function (loggerTest) {
  let sandbox

  loggerTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Winston, 'Logger')
    t.end()
  })

  loggerTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  loggerTest.test('logging should', function (loggingTest) {
    loggingTest.test('configure Winston and log properly', function (assert) {
      // Tests are all in one method due to the way Winston is configured in Logger.
      let addMethod = Sinon.stub()
      let logMethod = Sinon.stub()

      addMethod.returns({ log: logMethod })
      Winston.Logger.returns({ add: addMethod })

      Logger.debug('test %s', 'me')
      assert.ok(Winston.Logger.calledWithNew)
      assert.ok(addMethod.calledWith(Winston.transports.Console, Sinon.match({ timestamp: true, colorize: true })))
      assert.ok(logMethod.calledWith('debug', 'test %s', 'me'))

      let infoMessage = 'things are happening'
      Logger.info(infoMessage)
      assert.ok(logMethod.calledWith('info', infoMessage))

      let warnMessage = 'something bad is happening'
      Logger.warn(warnMessage)
      assert.ok(logMethod.calledWith('warn', warnMessage))

      let errorMessage = 'there was an exception'
      let ex = new Error()
      Logger.error(errorMessage, ex)
      assert.ok(logMethod.calledWith('error', errorMessage, ex))

      assert.end()
    })

    loggingTest.end()
  })

  loggerTest.end()
})
