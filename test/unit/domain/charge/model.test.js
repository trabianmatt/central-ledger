'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Model = require(`${src}/domain/charge/model`)
const Db = require(`${src}/db`)

Test('charges model', modelTest => {
  let sandbox

  function setupChargesDb (charges) {
    sandbox.stub(Db, 'connect').returns(P.resolve({ charges: charges }))
  }

  modelTest.beforeEach((t) => {
    sandbox = Sinon.sandbox.create()
    t.end()
  })

  modelTest.afterEach((t) => {
    sandbox.restore()
    t.end()
  })

  modelTest.test('getAll should', getAllTest => {
    getAllTest.test('return exception if db.connect throws', test => {
      const error = new Error()
      sandbox.stub(Db, 'connect').returns(P.reject(error))

      Model.getAll()
        .then(() => {
          test.fail('Should have thrown error')
        })
        .catch(err => {
          test.equal(err, error)
          test.end()
        })
    })

    getAllTest.test('return exception if db.findAsync throws', test => {
      const error = new Error()
      const findAsync = function () { return P.reject(error) }
      setupChargesDb({ findAsync: findAsync })

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

      const findAsync = Sinon.stub().returns(P.resolve(charges))
      setupChargesDb({ findAsync: findAsync })

      Model.getAll()
        .then((found) => {
          test.equal(found, charges)
          test.deepEqual(findAsync.firstCall.args[0], {})
          test.equal(findAsync.firstCall.args[1].order, 'name')
          test.end()
        })
        .catch(err => {
          test.fail(err)
        })
    })

    getAllTest.end()
  })

  modelTest.test('getAllSenderAsPayer should', getAllSenderAsPayerTest => {
    getAllSenderAsPayerTest.test('return exception if db.connect throws', test => {
      const error = new Error()
      sandbox.stub(Db, 'connect').returns(P.reject(error))

      Model.getAllSenderAsPayer()
        .then(() => {
          test.fail('Should have thrown error')
        })
        .catch(err => {
          test.equal(err, error)
          test.end()
        })
    })

    getAllSenderAsPayerTest.test('return exception if db.findAsync throws', test => {
      const error = new Error()
      const findAsync = function () { return P.reject(error) }
      setupChargesDb({ findAsync: findAsync })

      Model.getAllSenderAsPayer()
        .then(() => {
          test.fail('Should have thrown error')
        })
        .catch(err => {
          test.equal(err, error)
          test.end()
        })
    })

    getAllSenderAsPayerTest.test('return all charges ordered by name', test => {
      const charge1Name = 'charge1'
      const charge2Name = 'charge2'
      const charge3Name = 'charge3'
      const charges = [{ name: charge1Name }, { name: charge2Name }, {name: charge3Name}]
      const findArg = { payer: 'sender' }

      const findAsync = Sinon.stub().returns(P.resolve(charges))
      setupChargesDb({ findAsync: findAsync })

      Model.getAllSenderAsPayer()
        .then((found) => {
          test.equal(found, charges)
          test.deepEqual(findAsync.firstCall.args[0], findArg)
          test.equal(findAsync.firstCall.args[1].order, 'name')
          test.end()
        })
        .catch(err => {
          test.fail(err)
        })
    })

    getAllSenderAsPayerTest.end()
  })

  modelTest.test('create should', createTest => {
    createTest.test('save payload as new object', test => {
      const name = 'charge'
      const charge = { name }
      const saveAsync = Sinon.stub().returns(P.resolve(charge))
      setupChargesDb({ saveAsync: saveAsync })

      const payload = { name }

      Model.create(payload)
        .then(() => {
          const saveAsyncArg = saveAsync.firstCall.args[0]
          test.notEqual(saveAsyncArg, payload)
          test.equal(saveAsyncArg.name, payload.name)
          test.end()
        })
    })

    createTest.test('return newly created charge', test => {
      const name = 'charge'
      const charge = { name }
      const saveAsync = Sinon.stub().returns(P.resolve(charge))
      setupChargesDb({ saveAsync: saveAsync })

      Model.create({})
        .then(s => {
          test.equal(s, charge)
          test.end()
        })
        .catch(err => {
          test.fail(err)
        })
    })

    createTest.end()
  })

  modelTest.end()
})

