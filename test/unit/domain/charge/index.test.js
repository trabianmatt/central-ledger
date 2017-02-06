'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Model = require('../../../../src/domain/charge/model')
const ChargeService = require('../../../../src/domain/charge')

Test('Charge service', serviceTest => {
  let sandbox

  serviceTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Model)
    test.end()
  })

  serviceTest.afterEach(test => {
    sandbox.restore()
    test.end()
  })

  serviceTest.test('create should', createTest => {
    createTest.test('add charge in model', test => {
      const charge = {
        name: 'charge',
        chargeType: 'charge_type',
        rateType: 'rate_type',
        rate: '1.00',
        minimum: '0.25',
        maximum: '100.00',
        code: 1,
        is_active: true
      }
      Model.create.returns(P.resolve({}))
      ChargeService.create(charge)
      .then(() => {
        test.ok(Model.create.calledWith(charge))
        test.end()
      })
    })

    createTest.end()
  })

  serviceTest.test('getAll should', getAllTest => {
    getAllTest.test('getAll from Model', test => {
      const all = []
      Model.getAll.returns(P.resolve(all))
      ChargeService.getAll()
      .then(result => {
        test.equal(result, all)
        test.end()
      })
    })

    getAllTest.end()
  })

  serviceTest.end()
})

