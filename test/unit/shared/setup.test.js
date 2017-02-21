'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Hapi = require('hapi')
const P = require('bluebird')
const ErrorHandling = require('@leveloneproject/central-services-error-handling')
const Migrator = require('../../../src/lib/migrator')
const Db = require('../../../src/db')
const Eventric = require('../../../src/eventric')
const Plugins = require('../../../src/shared/plugins')

const Setup = require('../../../src/shared/setup')

Test('setup', setupTest => {
  let sandbox

  setupTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Hapi, 'Server')
    sandbox.stub(Plugins, 'registerPlugins')
    sandbox.stub(Db)
    sandbox.stub(Migrator)
    sandbox.stub(Eventric)
    test.end()
  })

  setupTest.afterEach(test => {
    sandbox.restore()
    test.end()
  })

  const createServer = () => {
    const server = {
      connection: sandbox.stub(),
      register: sandbox.stub()
    }
    Hapi.Server.returns(server)
    return server
  }

  setupTest.test('createServer should', createServerTest => {
    createServerTest.test('return Hapi Server', test => {
      const server = createServer()

      Setup.createServer().then(s => {
        test.deepEqual(s, server)
        test.end()
      })
    })

    createServerTest.test('setup connection', test => {
      const server = createServer()
      const port = 1234
      Setup.createServer(port).then(() => {
        test.ok(server.connection.calledWith(Sinon.match({
          port,
          routes: {
            validate: ErrorHandling.validateRoutes()
          }
        })))
        test.end()
      })
    })

    createServerTest.test('register shared plugins', test => {
      const server = createServer()
      Setup.createServer().then(() => {
        test.ok(Plugins.registerPlugins.calledWith(server))
        test.end()
      })
    })

    createServerTest.test('register provide modules', test => {
      const server = createServer()
      const modules = ['one', 'two']
      Setup.createServer(1234, modules).then(() => {
        test.ok(server.register.calledWith(modules))
        test.end()
      })
    })

    createServerTest.end()
  })

  setupTest.test('initialize should', initializeTest => {
    const setupPromises = () => {
      Migrator.migrate.returns(P.resolve())
      Db.connect.returns(P.resolve())
      Eventric.getContext.returns(P.resolve())
      return createServer()
    }

    initializeTest.test('run migrations, connect to db and return hapi server', test => {
      const server = setupPromises()

      Setup.initialize().then(s => {
        test.ok(Migrator.migrate.called)
        test.ok(Db.connect.called)
        test.notOk(Eventric.getContext.called)
        test.equal(s, server)
        test.end()
      })
    })

    initializeTest.test('setup eventric context if loadEventric', test => {
      setupPromises()

      Setup.initialize(1234, [], true).then(() => {
        test.ok(Migrator.migrate.called)
        test.ok(Db.connect.called)
        test.ok(Eventric.getContext.called)
        test.end()
      })
    })

    initializeTest.end()
  })

  setupTest.end()
})
