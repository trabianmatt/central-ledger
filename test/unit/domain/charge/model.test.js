'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Model = require(`${src}/domain/charge/model`)
const Db = require(`${src}/db`)

Test('charges model', function (modelTest) {
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

  modelTest.test('getAll should', function (getAllTest) {
    getAllTest.test('return exception if db.connect throws', function (assert) {
      const error = new Error()
      sandbox.stub(Db, 'connect').returns(P.reject(error))

      Model.getAll()
        .then(() => {
          assert.fail('Should have thrown error')
        })
        .catch(err => {
          assert.equal(err, error)
          assert.end()
        })
    })

    getAllTest.test('return exception if db.findAsync throws', function (assert) {
      const error = new Error()
      const findAsync = function () { return P.reject(error) }
      setupChargesDb({ findAsync: findAsync })

      Model.getAll()
        .then(() => {
          assert.fail('Should have thrown error')
        })
        .catch(err => {
          assert.equal(err, error)
          assert.end()
        })
    })

    getAllTest.test('return all charges ordered by name', function (assert) {
      const charge1Name = 'charge1'
      const charge2Name = 'charge2'
      const charges = [{ name: charge1Name }, { name: charge2Name }]

      const findAsync = Sinon.stub().returns(P.resolve(charges))
      setupChargesDb({ findAsync: findAsync })

      Model.getAll()
        .then((found) => {
          assert.equal(found, charges)
          assert.deepEqual(findAsync.firstCall.args[0], {})
          assert.equal(findAsync.firstCall.args[1].order, 'name')
          assert.end()
        })
        .catch(err => {
          assert.fail(err)
        })
    })

    getAllTest.end()
  })

  modelTest.test('create should', function (createTest) {
    createTest.test('save payload as new object', function (assert) {
      let name = 'charge'
      let charge = { name }
      let saveAsync = Sinon.stub().returns(P.resolve(charge))
      setupChargesDb({ saveAsync: saveAsync })

      let payload = { name }

      Model.create(payload)
        .then(() => {
          let saveAsyncArg = saveAsync.firstCall.args[0]
          assert.notEqual(saveAsyncArg, payload)
          assert.equal(saveAsyncArg.name, payload.name)
          assert.end()
        })
    })

    createTest.test('return newly created charge', function (t) {
      let name = 'charge'
      let charge = { name }
      let saveAsync = Sinon.stub().returns(P.resolve(charge))
      setupChargesDb({ saveAsync: saveAsync })

      Model.create({})
        .then(s => {
          t.equal(s, charge)
          t.end()
        })
        .catch(err => {
          t.fail(err)
        })
    })

    createTest.end()
  })

  modelTest.end()
})

