'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Path = require('path')
const Pmock = require('pmock')
const DbMigrate = require('db-migrate')
const Migrator = require('../../../src/lib/migrator')

let self = this

Test('migrator', function (migratorTest) {
  let cwd = '/test'
  let sandbox

  migratorTest.beforeEach(t => {
    self.cwd = Pmock.cwd(cwd)
    sandbox = Sinon.sandbox.create()
    sandbox.stub(DbMigrate, 'getInstance')
    t.end()
  })

  migratorTest.afterEach(t => {
    self.cwd.reset()
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
          assert.equal(getInstanceStubArg2.config, Path.join(cwd, 'config/db-migrate.json'))
          assert.equal(upStub.callCount, 1)
          assert.end()
        })
    })

    migrateTest.end()
  })

  migratorTest.end()
})
