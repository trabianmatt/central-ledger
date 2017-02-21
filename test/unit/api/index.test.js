'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')

const Logger = require('@leveloneproject/central-services-shared').Logger
const Config = require('../../../src/lib/config')
const Routes = require('../../../src/api/routes')
const Auth = require('../../../src/api/auth')
const Sockets = require('../../../src/api/sockets')
const Worker = require('../../../src/api/worker')
const Setup = require('../../../src/shared/setup')

Test('Api index', indexTest => {
  let sandbox

  indexTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Setup)
    sandbox.stub(Logger)
    test.end()
  })

  indexTest.afterEach(test => {
    sandbox.restore()
    test.end()
  })

  indexTest.test('export should', exportTest => {
    exportTest.test('initialize server', test => {
      const server = {
        start: sandbox.stub(),
        info: {
          uri: ''
        }
      }
      server.start.returns(P.resolve({}))
      Setup.initialize.returns(P.resolve(server))

      require('../../../src/api/index').then(() => {
        test.ok(Setup.initialize.calledWith(Config.PORT, [Auth, Routes, Sockets, Worker], true))
        test.ok(server.start.called)
        test.ok(Logger.info.called)
        test.end()
      })
    })
    exportTest.end()
  })

  indexTest.end()
})
