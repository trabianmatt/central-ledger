'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Path = require('path')
const Proxyquire = require('proxyquire')

Test('migrator', migratorTest => {
  let sandbox
  let configuredMigrationsFolder
  let knexStub
  let knexConnStub
  let Migrator

  migratorTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()

    knexConnStub = sandbox.stub()
    knexStub = sandbox.stub().returns(knexConnStub)

    configuredMigrationsFolder = 'migrations-path'

    Migrator = Proxyquire('../../../src/lib/migrator', { knex: knexStub, '../../config/knexfile': { migrations: { directory: `../${configuredMigrationsFolder}` } } })

    t.end()
  })

  migratorTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  migratorTest.test('migrate should', migrateTest => {
    migrateTest.test('override migrations directory path and run migrations', test => {
      let latestStub = sandbox.stub().returns(P.resolve())
      knexConnStub.migrate = { latest: latestStub }

      let updatedMigrationsPath = Path.join(process.cwd(), configuredMigrationsFolder)

      Migrator.migrate()
        .then(() => {
          test.equal(knexStub.firstCall.args[0].migrations.directory, updatedMigrationsPath)
          test.ok(latestStub.calledOnce)
          test.end()
        })
    })

    migrateTest.end()
  })

  migratorTest.end()
})
