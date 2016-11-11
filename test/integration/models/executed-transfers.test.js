'use strict'

const src = '../../../src'
const Test = require('tape')
const Fixtures = require('../../fixtures')
const Db = require(`${src}/db`)
const Model = require(`${src}/models/executed-transfers`)

Test('executed-transfers model', function (modelTest) {
  modelTest.test('create should', function (createTest) {
    createTest.test('create a new executedTransfer', function (assert) {
      let payload = { id: Fixtures.generateTransferId() }
      Model.create(payload)
        .then((executedTransfer) => {
          assert.end()
        })
    })

    createTest.end()
  })

  modelTest.test('truncate should', function (createTest) {
    createTest.test('truncate executedTransfers table', function (assert) {
      Model.truncate()
        .then((executedTransfer) => {
          Db.connect().then(db => db.executedTransfers.countAsync({}))
            .then((result) => {
              assert.equals(result, '0')
              assert.end()
            })
        })
    })

    createTest.end()
  })

  modelTest.end()
})

