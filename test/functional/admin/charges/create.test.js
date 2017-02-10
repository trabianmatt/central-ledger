'use strict'

const Test = require('tape')
const Base = require('../../base')
const Fixtures = require('../../../fixtures')

Test('POST /charges', putTest => {
  putTest.test('should create a charge', test => {
    const chargeName = Fixtures.generateRandomName()
    const payload = {
      name: chargeName,
      charge_type: 'tax',
      rate_type: 'flat',
      rate: '1.00',
      minimum: '25.00',
      maximum: '100.00',
      code: '003',
      is_active: true
    }

    Base.createCharge(payload)
      .expect(201)
      .then((res) => {
        test.equal(res.body.name, payload.name)
        test.equal(res.body.charge_type, payload.charge_type)
        test.equal(res.body.rate_type, payload.rate_type)
        test.equal(res.body.rate, payload.rate)
        test.equal(res.body.minimum, payload.minimum)
        test.equal(res.body.maximum, payload.maximum)
        test.equal(res.body.code, payload.code)
        test.equal(res.body.is_active, payload.is_active)
        test.end()
      })
  })

  putTest.end()
})
