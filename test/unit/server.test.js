'use strict'

const src = '../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Glue = require('glue')
const Logger = require('@leveloneproject/central-services-shared').Logger
const Eventric = require(`${src}/eventric`)
const Db = require(`${src}/db`)
const Migrator = require(`${src}/lib/migrator`)

Test('server', function (serverTest) {
  let sandbox

  serverTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Db, 'connect')
    sandbox.stub(Glue, 'compose')
    sandbox.stub(Eventric, 'getContext')
    sandbox.stub(Logger, 'info')
    sandbox.stub(Migrator, 'migrate')
    t.end()
  })

  serverTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  serverTest.test('exporting should', function (exportingTest) {
    let serverUri = 'http://central-ledger'

    exportingTest.test('run all required actions when starting server', function (assert) {
      let startStub = sandbox.stub().returns(Promise.resolve({}))
      let connection1 = {
        settings: {
          labels: 'api'
        },
        info: {
          uri: serverUri
        }
      }
      let connection2 = {
        settings: {
          labels: 'admin'
        },
        info: {
          uri: serverUri
        }
      }
      let connections = [connection1, connection2]
      let server = { start: startStub, connections: connections }

      Glue.compose.returns(Promise.resolve(server))
      Db.connect.returns(Promise.resolve({}))
      Migrator.migrate.returns(Promise.resolve({}))
      Eventric.getContext.returns({})

      require('../../src/server')
        .then(() => {
          assert.ok(Migrator.migrate.calledOnce)
          assert.ok(Db.connect.calledOnce)
          assert.ok(Eventric.getContext.calledOnce)
          assert.ok(Glue.compose.calledOnce)
          assert.ok(startStub.calledOnce)
          assert.equal(Logger.info.callCount, connections.length)
          assert.ok(Logger.info.calledWith('%s server running at: %s', connection1.settings.labels, connection1.info.uri))
          assert.ok(Logger.info.calledWith('%s server running at: %s', connection2.settings.labels, connection2.info.uri))
          assert.end()
        })
    })

    exportingTest.end()
  })

  serverTest.end()
})
