'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Db = require('../../src/lib/db')
const Glue = require('glue')
const Eventric = require('../../src/eventric')
const Migrator = require('../../src/lib/migrator')

Test('server', function (serverTest) {
  let sandbox

  serverTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Db, 'connect')
    sandbox.stub(Glue, 'compose')
    sandbox.stub(Eventric, 'getContext')
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
      let logStub = sandbox.stub()
      let startStub = sandbox.stub().returns(Promise.resolve({}))

      let server = { start: startStub, log: logStub, info: { uri: serverUri } }

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
          assert.equal(logStub.firstCall.args[0], 'info')
          assert.equal(logStub.firstCall.args[1], `Server running at: ${serverUri}`)
          assert.end()
        })
    })

    exportingTest.end()
  })

  serverTest.end()
})
