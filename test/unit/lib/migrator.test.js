'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const DbMigrate = require('db-migrate')
const Migrator = require('../../../src/lib/migrator')
const Config = require('../../../src/lib/config')

Test('migrator', function (migratorTest) {
  let sandbox

  migratorTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(DbMigrate, 'getInstance')
    t.end()
  })

  migratorTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  migratorTest.test('migrate should', function (migrateTest) {
    migrateTest.test('configure db-migrate and run migrations', function (assert) {
      let upStub = Sinon.stub().returns(P.resolve(null))
      DbMigrate.getInstance.returns({ up: upStub })

      Migrator.migrate()
        .then(() => {
          let getInstanceStubArg1 = DbMigrate.getInstance.firstCall.args[0]
          let getInstanceStubArg2 = DbMigrate.getInstance.firstCall.args[1]

          assert.equal(getInstanceStubArg1, true)
          assert.deepEqual(getInstanceStubArg2.config, {
            defaultEnv: 'local',
            'sql-file': true,
            local: Config.DATABASE_URI
          })
          assert.equal(upStub.callCount, 1)
          assert.end()
        })
    })

    migrateTest.end()
  })

  migratorTest.end()
})
