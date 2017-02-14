'use strict'

const Test = require('tape')
const Base = require('../../base')
const Fixtures = require('../../../fixtures')
const Config = require('../../../../src/lib/config')
const Util = require('../../../../src/lib/util')

const buildCharge = (name, rateType, code) => {
  return {
    'name': name,
    'charge_type': 'tax',
    'rate_type': rateType,
    'rate': '0.50',
    'code': code,
    'is_active': true,
    'payer': 'sender',
    'payee': 'ledger'
  }
}

Test('return the list of charges in a charge quote', function (assert) {
  const charge1Name = 'a' + Fixtures.generateRandomName()
  const charge2Name = 'b' + Fixtures.generateRandomName()

  const charge = buildCharge(charge1Name, 'percent', '001')
  const charge2 = buildCharge(charge2Name, 'flat', '002')

  Config.AMOUNT.SCALE = 2

  const amount = 20.00

  Base.createCharge(charge)
    .then(() => Base.createCharge(charge2))
    .then(() => {
      Base.postApi('/charges/quote', {amount: amount})
        .expect(200)
        .expect('Content-Type', /json/)
        .then(res => {
          assert.equal(charge.name, res.body[0].name)
          assert.equal(Util.formatAmount(charge.rate * amount), res.body[0].amount)
          assert.equal(charge.charge_type, res.body[0].charge_type)
          assert.equal(charge.code, res.body[0].code)

          assert.equal(charge2.name, res.body[1].name)
          assert.equal(charge2.rate, res.body[1].amount)
          assert.equal(charge2.charge_type, res.body[1].charge_type)
          assert.equal(charge2.code, res.body[1].code)

          assert.end()
        })
    })
})
