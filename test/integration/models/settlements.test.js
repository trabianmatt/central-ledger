'use strict'

const Test = require('tape')
const Model = require('../../../src/models/settlements')

Test('settlements model', function (modelTest) {
  modelTest.test('create should', function (createTest) {
    createTest.test('create a new settlement', function (assert) {
      let settlementId = Model.generateId()
      Model.create(settlementId)
        .then((settlement) => {
          assert.end()
        })
    })

    createTest.end()
  })

  modelTest.end()
})
