'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')

const Logger = require('../../../src/lib/logger')
const Config = require('../../../src/lib/config')
const Routes = require('../../../src/admin/routes')
const Auth = require('../../../src/admin/auth')
const Setup = require('../../../src/shared/setup')

Test('Admin index', indexTest => {
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

      require('../../../src/admin/index').then(() => {
        test.ok(Setup.initialize.calledWith({ port: Config.ADMIN_PORT, modules: [Auth, Routes] }))
        test.ok(server.start.called)
        test.ok(Logger.info.called)
        test.end()
      })
    })
    exportTest.end()
  })

  indexTest.end()
})
