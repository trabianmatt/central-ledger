'use strict'

const src = '../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Model = require(`${src}/models/settled-transfers`)
const Db = require(`${src}/db`)

Test('settled-transfers model', function (modelTest) {
  let sandbox

  modelTest.beforeEach((t) => {
    sandbox = Sinon.sandbox.create()
    t.end()
  })

  modelTest.afterEach((t) => {
    sandbox.restore()
    t.end()
  })

  modelTest.test('create should', function (createTest) {
    createTest.test('invoke runAsync on db', function (assert) {
      let runAsync = sandbox.stub().returns(Promise.resolve())
      sandbox.stub(Db, 'connect').returns(Promise.resolve({ runAsync: runAsync }))

      let transfer = { id: '1234', settlementId: 'abc' }

      Model.create(transfer)
        .then(() => {
          assert.ok(runAsync.calledWith(`INSERT INTO "settledTransfers" ("transferId", "settlementId") VALUES (uuid('${transfer.id}'), uuid('${transfer.settlementId}'))`))
          assert.end()
        }
        )
    })

    createTest.end()
  })

  modelTest.test('truncate should', function (truncateTest) {
    truncateTest.test('invoke runAsync on db', function (assert) {
      let runAsync = sandbox.stub().returns(Promise.resolve())
      sandbox.stub(Db, 'connect').returns(Promise.resolve({ runAsync: runAsync }))

      Model.truncate()
        .then(() => {
          assert.ok(runAsync.calledWith('TRUNCATE "settledTransfers"'))
          assert.end()
        }
        )
    })

    truncateTest.end()
  })

  modelTest.end()
})
