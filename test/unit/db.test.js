const Test = require('tape')
const Sinon = require('sinon')
const Proxyquire = require('proxyquire')

Test('db', function (dbTest) {
  dbTest.test('connect should', function (connectTest) {
    connectTest.test('connect using config values', function (t) {
      var fakeDb = {}
      var connectStub = Sinon.stub().yields(null, fakeDb)
      var config = { DATABASE_URI: 'some-data-uri' }
      var db = Proxyquire('../../src/lib/db', {
        'massive': { connect: connectStub },
        '../lib/config': config
      })

      db.connect
        .then(db => {
          t.equal(db, fakeDb)
          t.equal(connectStub.callCount, 1)
          t.equal(connectStub.firstCall.args[0].connectionString, config.DATABASE_URI)
          t.end()
        })
    })

    connectTest.end()
  })
  dbTest.end()
})
