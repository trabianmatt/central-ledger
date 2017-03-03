'use strict'

const src = '../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Proxyquire = require('proxyquire')
const Config = require(`${src}/lib/config`)

Test('db', dbTest => {
  let sandbox
  let knexStub
  let Db

  let goodDatabaseUri = 'postgres://some-data-uri'

  dbTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    knexStub = sandbox.stub().returns({})
    Db = Proxyquire(`${src}/db`, { knex: knexStub })
    t.end()
  })

  dbTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  dbTest.test('connect should', connectTest => {
    connectTest.test('connect using config values and setup table properties', assert => {
      Config.DATABASE_URI = goodDatabaseUri
      Db.connect()
        .then(db => {
          assert.ok(knexStub.calledOnce)
          assert.equal(knexStub.firstCall.args[0].client, 'pg')
          assert.equal(knexStub.firstCall.args[0].connection, goodDatabaseUri)
          Db.tables.forEach(tbl => {
            assert.ok(Db[tbl])
          })
          assert.notOk(Db.tableNotExists)
          assert.end()
        })
    })

    connectTest.test('throw error for invalid database uri', assert => {
      Config.DATABASE_URI = 'invalid'
      Db.connect()
        .then(db => {
          assert.fail('Should have thrown error')
          assert.end()
        })
        .catch(err => {
          assert.notOk(knexStub.called)
          assert.equal(err.message, 'Invalid database type in database URI')
          assert.end()
        })
    })

    connectTest.test('throw error for unsupported database type', assert => {
      Config.DATABASE_URI = 'mysql://some-data-uri'
      Db.connect()
        .then(db => {
          assert.fail('Should have thrown error')
          assert.end()
        })
        .catch(err => {
          assert.notOk(knexStub.called)
          assert.equal(err.message, 'Invalid database type in database URI')
          assert.end()
        })
    })

    connectTest.test('only create one connection', assert => {
      Config.DATABASE_URI = goodDatabaseUri
      Db.connect()
      .then(db1 => {
        Db.connect()
        .then(db2 => {
          assert.equal(db1, db2)
          assert.ok(knexStub.calledOnce)
          assert.end()
        })
      })
    })

    connectTest.end()
  })
  dbTest.end()
})
