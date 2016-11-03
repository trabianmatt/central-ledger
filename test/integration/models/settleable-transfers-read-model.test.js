'use strict'

const src = '../../../src'
const Test = require('tape')
const Uuid = require('uuid4')
const ExecutedTransfersModel = require(`${src}/models/executed-transfers`)
const SettledTransfersModel = require(`${src}/models/settled-transfers`)
const ReadModel = require(`${src}/models/settleable-transfers-read-model`)
const Fixtures = require('../../fixtures')

Test('transfers read model', function (modelTest) {
  modelTest.test('getSettleableTransfers should', function (getSettleableTransfersTest) {
    getSettleableTransfersTest.test('retrieve transfer ids that are executed but not settled', function (assert) {
      let unSettledTransferId = Fixtures.generateTransferId()
      let settledTransferId = Fixtures.generateTransferId()

      ExecutedTransfersModel.create({ id: unSettledTransferId })
        .then(() => ExecutedTransfersModel.create({ id: settledTransferId }))
        .then(() => SettledTransfersModel.create({ id: settledTransferId, settlementId: Uuid() }))
        .then(() =>
          ReadModel.getSettleableTransfers().then(result => {
            assert.notOk(result.find(x => x.transferId === settledTransferId))
            assert.ok(result.find(x => x.transferId === unSettledTransferId))
            assert.end()
          }))
    })

    getSettleableTransfersTest.end()
  })

  modelTest.end()
})
