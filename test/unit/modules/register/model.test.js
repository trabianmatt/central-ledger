'use strict'

const Test = require('tape')
const Proxyquire = require('proxyquire')
const Sinon = require('sinon')
const Uuid = require('uuid4')

function createModel (db) {
  return Proxyquire('../../../../src/modules/register/model', {
    '../../lib/db': db
  })
}

function setupRegistrationsDb (registrations) {
  var db = { registrations: registrations }
  return {
    connect: Promise.resolve(db)
  }
}

Test('registration model', function (modelTest) {
  modelTest.test('getByIdentifier should', function (getByIdentifierTest) {
    getByIdentifierTest.test('return exception if db.connect throws', function (assert) {
      let error = new Error()
      let db = { connect: Promise.reject(error) }
      var model = createModel(db)

      model.getByIdentifier('dfsp1')
        .then(() => {
          assert.fail('Should have thrown error')
        })
        .catch(err => {
          assert.equal(err, error)
          assert.end()
        })
    })

    getByIdentifierTest.test('return exception if db.findOneAsync throws', function (assert) {
      let error = new Error()
      let findOneAsync = function () { return Promise.reject(error) }
      let db = setupRegistrationsDb({ findOneAsync: findOneAsync })
      let model = createModel(db)

      model.getByIdentifier('dfsp1')
        .then(() => {
          assert.fail('Should have thrown error')
        })
        .catch(err => {
          assert.equal(err, error)
          assert.end()
        })
    })

    getByIdentifierTest.test('finds registration by identifier', function (assert) {
      let identifier = 'dfsp1'
      let registration = { identifier: identifier }
      let findOneAsync = Sinon.stub().returns(Promise.resolve(registration))
      let model = createModel(setupRegistrationsDb({ findOneAsync: findOneAsync }))

      model.getByIdentifier(identifier)
        .then(r => {
          assert.equal(r, registration)
          assert.equal(findOneAsync.firstCall.args[0].identifier, identifier)
          assert.end()
        })
        .catch(err => {
          assert.fail(err)
        })
    })

    getByIdentifierTest.end()
  })

  modelTest.test('create should', function (createTest) {
    createTest.test('save payload as new object', function (assert) {
      let saveAsync = Sinon.stub()
      let model = createModel(setupRegistrationsDb({ saveAsync: saveAsync }))
      let payload = { identifier: 'dfsp1', name: 'DFSP' }
      model.create(payload)
        .then(() => {
          let saveAsyncArg = saveAsync.firstCall.args[0]
          assert.ok(saveAsyncArg.registrationUuid)
          assert.notEqual(saveAsyncArg, payload)
          assert.equal(saveAsyncArg.identifier, payload.identifier)
          assert.equal(saveAsyncArg.name, payload.name)
          assert.end()
        })
    })

    createTest.test('return newly created registration', function (t) {
      let newRegistration = { registrationUuid: Uuid() }
      let saveAsync = Sinon.stub().returns(newRegistration)
      let model = createModel(setupRegistrationsDb({ saveAsync: saveAsync }))
      model.create({})
        .then(s => {
          t.equal(s, newRegistration)
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
