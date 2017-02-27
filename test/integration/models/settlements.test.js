'use strict'

const Test = require('tape')
const Model = require('../../../src/models/settlements')

Test('settlements model', modelTest => {
  modelTest.test('create should', createTest => {
    createTest.test('create a new settlement', test => {
      let settlementId = Model.generateId()
      Model.create(settlementId)
        .then((settlement) => {
          test.ok(settlement)
          test.equal(settlement.settlementId, settlementId)
          test.end()
        })
    })

    createTest.end()
  })

  modelTest.end()
})
