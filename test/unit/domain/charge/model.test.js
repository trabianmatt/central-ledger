'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Model = require(`${src}/domain/charge/model`)
const Db = require(`${src}/db`)

Test('charges model', modelTest => {
  let sandbox
  let chargesStubs

  modelTest.beforeEach((t) => {
    sandbox = Sinon.sandbox.create()
    chargesStubs = {
      insert: sandbox.stub(),
      where: sandbox.stub(),
      orderBy: sandbox.stub(),
      update: sandbox.stub()
    }

    Db.charges = sandbox.stub().returns(chargesStubs)

    t.end()
  })

  modelTest.afterEach((t) => {
    sandbox.restore()
    t.end()
  })

  modelTest.test('getAll should', getAllTest => {
    getAllTest.test('return exception if db query throws', test => {
      const error = new Error()

      let orderByStub = sandbox.stub().returns(P.reject(error))
      chargesStubs.where.withArgs({ isActive: true }).returns({ orderBy: orderByStub })

      Model.getAll()
        .then(() => {
          test.fail('Should have thrown error')
        })
        .catch(err => {
          test.equal(err, error)
          test.end()
        })
    })

    getAllTest.test('return all charges ordered by name', test => {
      const charge1Name = 'charge1'
      const charge2Name = 'charge2'
      const charges = [{ name: charge1Name }, { name: charge2Name }]

      let orderByStub = sandbox.stub().returns(P.resolve(charges))
      chargesStubs.where.withArgs({ isActive: true }).returns({ orderBy: orderByStub })

      Model.getAll()
        .then((found) => {
          test.equal(found, charges)
          test.end()
        })
        .catch(err => {
          test.fail(err)
        })
    })

    getAllTest.end()
  })

  modelTest.test('getByName should', getByNameTest => {
    getByNameTest.test('return exception if db query throws', test => {
      const error = new Error()
      const name = 'charge1'

      chargesStubs.where.withArgs({ name: name }).returns({ first: sandbox.stub().returns(P.reject(error)) })

      Model.getByName(name)
        .then(() => {
          test.fail('Should have thrown error')
        })
        .catch(err => {
          test.equal(err, error)
          test.end()
        })
    })

    getByNameTest.test('returns a charge with the given name', test => {
      const name = 'charge1'
      const charge = { name }

      chargesStubs.where.withArgs({ name: name }).returns({ first: sandbox.stub().returns(P.resolve(charge)) })

      Model.getByName(name)
        .then((found) => {
          test.equal(found, charge)
          test.end()
        })
        .catch(err => {
          test.fail(err)
        })
    })

    getByNameTest.end()
  })

  modelTest.test('getAllSenderAsPayer should', getAllSenderAsPayerTest => {
    getAllSenderAsPayerTest.test('return exception if db query throws', test => {
      const error = new Error()

      let orderByStub = sandbox.stub().returns(P.reject(error))
      let andWhereStub = sandbox.stub().returns({ orderBy: orderByStub })
      chargesStubs.where.withArgs({ payer: 'sender' }).returns({ andWhere: andWhereStub })

      Model.getAllSenderAsPayer()
        .then(() => {
          test.fail('Should have thrown error')
        })
        .catch(err => {
          test.ok(orderByStub.withArgs('name', 'asc').calledOnce)
          test.equal(err, error)
          test.end()
        })
    })

    getAllSenderAsPayerTest.test('return all charges ordered by name', test => {
      const charges = [{ name: 'charge1' }, { name: 'charge2' }, { name: 'charge3' }]

      let orderByStub = sandbox.stub().returns(P.resolve(charges))
      let andWhereStub = sandbox.stub().returns({ orderBy: orderByStub })
      chargesStubs.where.withArgs({ payer: 'sender' }).returns({ andWhere: andWhereStub })

      Model.getAllSenderAsPayer()
        .then((found) => {
          test.ok(orderByStub.withArgs('name', 'asc').calledOnce)
          test.equal(found, charges)
          test.end()
        })
        .catch(err => {
          test.fail(err)
        })
    })

    getAllSenderAsPayerTest.end()
  })

  modelTest.test('create should', createTest => {
    createTest.test('save payload and return new charge', test => {
      let name = 'charge'
      let charge = { name }

      chargesStubs.insert.returns(P.resolve([charge]))

      const payload = { name }

      Model.create(payload)
        .then(created => {
          const insertArg = chargesStubs.insert.firstCall.args[0]
          test.notEqual(insertArg, payload)
          test.equal(created, charge)
          test.end()
        })
    })

    createTest.end()
  })

  modelTest.test('update should', updateTest => {
    updateTest.test('save everything but name and return updated charge', test => {
      let name = 'charge'
      let charge = {
        chargeId: 1,
        name
      }

      const payload = {
        name: 'charge_b',
        minimum: '1.00',
        maximum: '100.00',
        code: '002',
        is_active: true
      }

      const fields = {
        name: payload.name,
        minimum: payload.minimum,
        maximum: payload.maximum,
        code: payload.code,
        isActive: payload.is_active
      }

      const updatedCharge = {
        chargeId: 1,
        name: payload.name
      }

      let updateStub = sandbox.stub().returns(P.resolve([updatedCharge]))
      chargesStubs.where.withArgs({ chargeId: charge.chargeId }).returns({ update: updateStub })

      Model.update(charge, payload)
        .then(updated => {
          test.ok(chargesStubs.where.withArgs({ chargeId: charge.chargeId }.calledOnce))
          test.ok(updateStub.withArgs(fields, '*').calledOnce)
          test.equal(updated, updatedCharge)
          test.end()
        })
    })

    updateTest.end()
  })

  modelTest.end()
})

