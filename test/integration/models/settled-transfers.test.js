'use strict'

const Test = require('tape')
const Uuid = require('uuid4')
const Model = require('../../../src/models/settled-transfers')
const Fixtures = require('../../fixtures')
const Db = require('../../../src/db')

Test('settled-transfers model', function (modelTest) {
  modelTest.test('create should', function (createTest) {
    createTest.test('create a new settledTransfer', function (assert) {
      let payload = { id: Fixtures.generateTransferId(), settlementId: Uuid() }
      createSettledTransfer(payload)
        .then((settledTransfer) => {
          assert.end()
        })
    })

    createTest.end()
  })

  modelTest.test('truncate should', function (truncateTest) {
    truncateTest.test('truncate settledTransfers table', function (assert) {
      Model.truncate()
        .then((executedTransfer) => {
          Db.connect().then(db => db.settledTransfers.countAsync({}))
            .then((result) => {
              assert.equals(result, '0')
              assert.end()
            })
        })
    })

    truncateTest.end()
  })

  modelTest.end()
})

function createSettledTransfer (payload) {
  return Model.create(payload)
}
