'use strict'

const src = '../../../src'
const P = require('bluebird')
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Proxyquire = require('proxyquire')
const Config = require(`${src}/lib/config`)

Test('db', dbTest => {
  let sandbox
  let knexStub
  let tableStub
  let knexConnStub
  let Db

  let goodDatabaseUri = 'postgres://some-data-uri'
  let tableNames = [{ tablename: 'accounts' }, { tablename: 'users' }, { tablename: 'tokens' }]

  dbTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()

    knexConnStub = sandbox.stub()
    knexConnStub.destroy = sandbox.stub()
    knexConnStub.client = { config: { client: 'pg' } }
    knexConnStub.withArgs('pg_catalog.pg_tables').returns({ where: sandbox.stub().withArgs({ schemaname: 'public' }).returns({ select: sandbox.stub().withArgs('tablename').returns(P.resolve(tableNames)) }) })

    knexStub = sandbox.stub().returns(knexConnStub)

    tableStub = sandbox.stub()

    Db = Proxyquire(`${src}/db`, { knex: knexStub, './table': tableStub })
    Config.DATABASE_URI = goodDatabaseUri
    t.end()
  })

  dbTest.afterEach(t => {
    sandbox.restore()
    Db.disconnect()
    t.end()
  })

  dbTest.test('connect should', connectTest => {
    connectTest.test('connect using config values and setup table properties', test => {
      Db.connect()
        .then(conn => {
          test.ok(knexStub.calledOnce)
          test.equal(knexStub.firstCall.args[0].client, 'pg')
          test.equal(knexStub.firstCall.args[0].connection, goodDatabaseUri)

          test.equal(Db._tables.length, tableNames.length)
          tableNames.forEach(tbl => {
            test.ok(Db[tbl.tablename])
          })
          test.notOk(Db.tableNotExists)

          test.end()
        })
    })

    connectTest.test('throw error for invalid database uri', test => {
      Config.DATABASE_URI = 'invalid'
      Db.connect()
        .then(conn => {
          test.fail('Should have thrown error')
          test.end()
        })
        .catch(err => {
          test.notOk(knexStub.called)
          test.equal(err.message, 'Invalid database type in database URI')
          test.end()
        })
    })

    connectTest.test('throw error for unsupported database type', test => {
      Config.DATABASE_URI = 'mysql://some-data-uri'
      Db.connect()
        .then(conn => {
          test.fail('Should have thrown error')
          test.end()
        })
        .catch(err => {
          test.notOk(knexStub.called)
          test.equal(err.message, 'Invalid database type in database URI')
          test.end()
        })
    })

    connectTest.test('throw error if database type not supported for listing tables', test => {
      delete Db._listTableQueries['pg']
      Db.connect()
        .then(conn => {
          test.fail('Should have thrown error')
          test.end()
        })
        .catch(err => {
          test.equal(err.message, 'Listing tables is not supported for database type pg')
          test.end()
        })
    })

    connectTest.test('only create one connection', test => {
      Db.connect()
      .then(conn1 => {
        Db.connect()
        .then(conn2 => {
          test.equal(conn1, conn2)
          test.ok(knexStub.calledOnce)
          test.end()
        })
      })
    })

    connectTest.end()
  })

  dbTest.test('known table property should', tablePropTest => {
    tablePropTest.test('create new query object for known table', test => {
      let tableName = tableNames[0].tablename

      let obj = {}
      tableStub.returns(obj)

      Db.connect()
        .then(db => {
          let table = Db[tableName]
          test.equal(table, obj)
          test.ok(tableStub.calledWith(tableName, knexConnStub))
          test.end()
        })
    })

    tablePropTest.end()
  })

  dbTest.test('disconnect should', disconnectTest => {
    disconnectTest.test('call destroy and reset connection', test => {
      Db.connect()
        .then(db => {
          test.ok(Db._knex)

          Db.disconnect()
          test.ok(knexConnStub.destroy.calledOnce)
          test.notOk(Db._knex)

          test.end()
        })
    })

    disconnectTest.test('remove table properties and reset table list to empty', test => {
      Db.connect()
        .then(db => {
          test.ok(Db[tableNames[0].tablename])
          test.equal(Db._tables.length, tableNames.length)

          Db.disconnect()
          test.notOk(Db[tableNames[0].tablename])
          test.equal(Db._tables.length, 0)

          test.end()
        })
    })

    disconnectTest.test('do nothing if not connected', test => {
      Db.connect()
        .then(db => {
          test.ok(Db._knex)

          Db.disconnect()
          test.equal(knexConnStub.destroy.callCount, 1)
          test.notOk(Db._knex)

          Db.disconnect()
          test.equal(knexConnStub.destroy.callCount, 1)
          test.notOk(Db._knex)

          test.end()
        })
    })

    disconnectTest.end()
  })

  dbTest.test('from should', fromTest => {
    fromTest.test('create a new knex object for specified table', test => {
      let tableName = 'table'

      let obj = {}
      tableStub.returns(obj)

      Db.connect()
        .then(db => {
          let fromTable = Db.from(tableName)
          test.equal(fromTable, obj)
          test.ok(tableStub.calledWith(tableName, knexConnStub))
          test.end()
        })
    })

    fromTest.test('throw error if database not connected', test => {
      let tableName = 'table'

      let obj = {}
      tableStub.returns(obj)

      try {
        Db.from(tableName)
        test.fail('Should have thrown error')
      } catch (err) {
        test.equal(err.message, 'The database must be connected to get a table object')
        test.end()
      }
    })

    fromTest.end()
  })

  dbTest.end()
})
