'use strict'

const Test = require('tape')
const Fixtures = require('../../../fixtures')
const Model = require('../../../../src/domain/charge/model')

function createChargePayload (name) {
  return {
    name,
    charge_type: 'charge_type',
    rate_type: 'rate_type',
    rate: '1.00',
    minimum: '0.25',
    maximum: '100.00',
    code: '1',
    is_active: true,
    payer: 'ledger',
    payee: 'sender'
  }
}

Test('charges model', function (modelTest) {
  modelTest.test('create should', function (createTest) {
    createTest.test('create a new charge', function (assert) {
      const chargeName = Fixtures.generateRandomName()
      const payload = createChargePayload(chargeName)

      Model.create(payload)
        .then((charge) => {
          assert.equal(charge.name, payload.name)
          assert.equal(charge.chargeType, payload.charge_type)
          assert.equal(charge.rateType, payload.rate_type)
          assert.equal(charge.rate, payload.rate)
          assert.equal(charge.minimum, payload.minimum)
          assert.equal(charge.maximum, payload.maximum)
          assert.equal(charge.code, payload.code)
          assert.equal(charge.isActive, payload.is_active)
          assert.ok(charge.createdDate)
          assert.ok(charge.chargeId)
          assert.end()
        })
    })

    createTest.end()
  })

  modelTest.test('getAll should', function (getAllTest) {
    getAllTest.test('return all charges', function (assert) {
      const charge1Name = Fixtures.generateRandomName()
      const charge2Name = Fixtures.generateRandomName()

      const chargePayload1 = createChargePayload(charge1Name)
      const chargePayload2 = createChargePayload(charge2Name)

      Model.create(chargePayload1)
        .then(() => Model.create(chargePayload2))
        .then(() => Model.getAll())
        .then((charges) => {
          assert.ok(charges.length > 0)
          assert.ok(charges.find(a => a.name === charge1Name))
          assert.ok(charges.find(a => a.name === charge2Name))
          assert.end()
        })
    })

    getAllTest.end()
  })

  modelTest.test('getAllSenderAsPayer should', function (getAllTest) {
    getAllTest.test('return all charges where the sender is the payer', function (assert) {
      const charge1Name = Fixtures.generateRandomName()
      const charge2Name = Fixtures.generateRandomName()
      const charge3Name = Fixtures.generateRandomName()

      const chargePayload1 = createChargePayload(charge1Name)
      const chargePayload2 = createChargePayload(charge2Name)
      const chargePayload3 = createChargePayload(charge3Name)
      chargePayload3.payer = 'sender'
      chargePayload3.payee = 'ledger'

      Model.create(chargePayload1)
        .then(() => Model.create(chargePayload2))
        .then(() => Model.create(chargePayload3))
        .then(() => Model.getAllSenderAsPayer())
        .then((charges) => {
          assert.ok(charges.length === 1)
          assert.ok(charges.find(a => a.name === charge3Name))
          assert.end()
        })
    })

    getAllTest.end()
  })

  modelTest.end()
})
