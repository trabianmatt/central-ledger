'use strict'

const Sinon = require('sinon')
const Test = require('tapes')(require('tape'))
const P = require('bluebird')
const Config = require('../../../../src/lib/config')
const Handler = require('../../../../src/admin/charges/handler')
const Charge = require('../../../../src/domain/charge')

function createCharge (name = 'charge') {
  return {
    name,
    charge_type: 'charge_type',
    rate_type: 'rate_type',
    rate: '1.00',
    minimum: '0.25',
    maximum: '100.00',
    code: '001',
    is_active: true,
    payer: 'ledger',
    payee: 'sender'
  }
}

Test('charges handler', handlerTest => {
  let sandbox
  let originalHostName
  let hostname = 'http://some-host'

  handlerTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    originalHostName = Config.HOSTNAME
    Config.HOSTNAME = hostname
    sandbox.stub(Charge, 'getAll')
    sandbox.stub(Charge, 'create')
    t.end()
  })

  handlerTest.afterEach(t => {
    Config.HOSTNAME = originalHostName
    sandbox.restore()
    t.end()
  })

  handlerTest.test('getAll should', getAllTest => {
    getAllTest.test('get all charges and format list', test => {
      const charge1 = createCharge('charge1')
      const charge2 = createCharge('charge2')

      const charges = [charge1, charge2]

      Charge.getAll.returns(P.resolve(charges))

      const reply = response => {
        test.equal(response.length, 2)
        const item1 = response[0]
        test.equal(item1.name, charge1.name)
        test.equal(item1.id, charge1.chargeId)
        test.equal(item1.charge_type, charge1.chargeType)
        test.equal(item1.rate_type, charge1.rateType)
        test.equal(item1.rate, charge1.rate)
        test.equal(item1.minimum, charge1.minimum)
        test.equal(item1.maximum, charge1.maximum)
        test.equal(item1.code, charge1.code)
        test.equal(item1.is_active, charge1.isActive)
        test.equal(item1.created, charge1.createdDate)
        const item2 = response[1]
        test.equal(item2.name, charge2.name)
        test.equal(item2.id, charge2.chargeId)
        test.equal(item2.charge_type, charge2.chargeType)
        test.equal(item2.rate_type, charge2.rateType)
        test.equal(item2.rate, charge2.rate)
        test.equal(item2.minimum, charge2.minimum)
        test.equal(item2.maximum, charge2.maximum)
        test.equal(item2.code, charge2.code)
        test.equal(item2.is_active, charge2.isActive)
        test.equal(item2.created, charge2.createdDate)
        test.end()
      }

      Handler.getAll({}, reply)
    })

    getAllTest.test('reply with error if Charge services throws', test => {
      const error = new Error()
      Charge.getAll.returns(P.reject(error))

      const reply = (e) => {
        test.equal(e, error)
        test.end()
      }
      Handler.getAll({}, reply)
    })

    getAllTest.end()
  })

  handlerTest.test('create should', createTest => {
    createTest.test('create a charge', test => {
      const charge = createCharge()

      const payload = {
        name: 'charge',
        chargeType: 'charge',
        rateType: 'rate',
        rate: '1',
        minimum: '1',
        maximum: '100',
        code: '1',
        is_active: true,
        payer: 'ledger',
        payee: 'sender'
      }

      Charge.create.withArgs(payload).returns(P.resolve(charge))

      const reply = response => {
        test.equal(response.name, charge.name)
        test.equal(response.id, charge.chargeId)
        test.equal(response.charge_type, charge.chargeType)
        test.equal(response.rate_type, charge.rateType)
        test.equal(response.rate, charge.rate)
        test.equal(response.minimum, charge.minimum)
        test.equal(response.maximum, charge.maximum)
        test.equal(response.code, charge.code)
        test.equal(response.is_active, charge.isActive)
        test.equal(response.created, charge.createdDate)
        return {
          code: (statusCode) => {
            test.equal(statusCode, 201)
            test.end()
          }
        }
      }

      Handler.create({payload}, reply)
    })

    createTest.test('reply with error if Charge services throws', test => {
      const error = new Error()

      const payload = {
        name: 'charge',
        chargeType: 'tax',
        rateType: 'flat',
        rate: '1.00',
        minimum: '1.00',
        maximum: '100.00',
        code: '001',
        is_active: true,
        payer: 'ledger',
        payee: 'sender'
      }

      Charge.create.withArgs(payload).returns(P.reject(error))

      const reply = (e) => {
        test.equal(e, error)
        test.end()
      }
      Handler.create({payload}, reply)
    })

    createTest.test('reply with validation error if payer and payee match', test => {
      const charge = createCharge('charge')
      charge.payer = 'ledger'
      charge.payee = 'ledger'

      const payload = {
        name: 'charge',
        chargeType: 'tax',
        rateType: 'flat',
        rate: '1.00',
        minimum: '1.00',
        maximum: '100.00',
        code: '001',
        is_active: true,
        payer: 'ledger',
        payee: 'ledger'
      }

      Charge.create.withArgs(payload).returns(P.resolve(charge))

      const reply = (e) => {
        test.equal(e.name, 'ValidationError')
        test.equal(e.payload.message, 'Payer and payee should be set to \'sender\', \'receiver\', or \'ledger\' and should not have the same value.')
        test.end()
      }
      Handler.create({payload}, reply)
    })

    createTest.end()
  })

  handlerTest.end()
})
