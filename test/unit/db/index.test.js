'use strict'

const src = '../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Massive = require('massive')
const P = require('bluebird')
const Config = require(`${src}/lib/config`)
const Db = require(`${src}/db`)

Test('db', dbTest => {
  let sandbox

  dbTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Massive, 'connect')
    sandbox.stub(P, 'promisifyAll')
    Db.resetConnection()
    t.end()
  })

  dbTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  dbTest.test('connect should', connectTest => {
    connectTest.test('connect using config values', t => {
      let fakeDb = {}
      let scriptsDir = `${process.cwd()}/src/db`
      let databaseUri = 'some-data-uri'
      let connectStub = Massive.connect
      connectStub.yields(null, fakeDb)
      Config.DATABASE_URI = databaseUri

      Db.connect()
        .then(db => {
          t.equal(db, fakeDb)
          t.equal(connectStub.callCount, 1)
          t.equal(connectStub.firstCall.args[0].connectionString, databaseUri)
          t.equal(connectStub.firstCall.args[0].scripts, scriptsDir)
          t.end()
        })
    })

    connectTest.test('promisify db', t => {
      let d = { someFunction: function () {} }
      Massive.connect.yields(null, d)
      Db.connect()
      .then(db => {
        t.ok(P.promisifyAll.calledWith(d))
        t.end()
      })
    })

    connectTest.test('promisify only db object properties', t => {
      let d = { prop1: {}, prop2: {}, func1: function () {} }
      Massive.connect.yields(null, d)
      Db.connect()
      .then(db => {
        t.ok(P.promisifyAll.calledWith(d.prop1))
        t.ok(P.promisifyAll.calledWith(d.prop2))
        t.notOk(P.promisifyAll.calledWith(d.func1))
        t.end()
      })
    })

    connectTest.test('only create one connection', t => {
      let d = {}
      Massive.connect.yields(null, d)
      Db.connect()
      .then(db1 => {
        Db.connect()
        .then(db2 => {
          t.equal(db1, db2)
          t.ok(P.promisifyAll.calledWith(d))
          t.ok(P.promisifyAll.calledOnce)
          t.ok(Massive.connect.calledOnce)
          t.end()
        })
      })
    })

    connectTest.end()
  })
  dbTest.end()
})
