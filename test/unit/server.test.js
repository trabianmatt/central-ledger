'use strict'

const src = '../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Db = require(`${src}/db`)
const Glue = require('glue')
const Eventric = require(`${src}/eventric`)
const Logger = require(`${src}/lib/logger`)
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
      let server = { start: startStub, info: { uri: serverUri } }

      Glue.compose.returns(Promise.resolve(server))
      Db.connect.returns(Promise.resolve({}))
      Migrator.migrate.returns(Promise.resolve({}))
      Eventric.getContext.returns({})

      require('../../src/server')
        .then(() => {
          assert.equal(Migrator.migrate.callCount, 1)
          assert.equal(Db.connect.callCount, 1)
          assert.equal(Eventric.getContext.callCount, 1)
          assert.equal(Glue.compose.callCount, 1)
          assert.equal(startStub.callCount, 1)
          assert.equal(Logger.info.callCount, 1)
          assert.ok(Logger.info.calledWith('Server running at: %s', serverUri))
          assert.end()
        })
    })

    exportingTest.end()
  })

  serverTest.end()
})
