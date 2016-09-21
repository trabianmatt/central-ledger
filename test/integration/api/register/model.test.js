'use strict'

const Test = require('tape')
const Model = require('../../../../src/api/register/model')

Test('registration model', function (modelTest) {
  modelTest.test('create should', function (createTest) {
    createTest.test('create a new registration', function (assert) {
      let payload = { identifier: 'dfsp1', name: 'DFSP' }
      createRegistration(payload)
        .then((registration) => {
          assert.ok(registration.registrationId)
          assert.ok(registration.registrationUuid)
          assert.equal(registration.identifier, payload.identifier)
          assert.equal(registration.name, payload.name)
          assert.ok(registration.createdDate)
          assert.end()
        })
    })

    createTest.end()
  })

  modelTest.test('getByIdentifier should', function (getByIdentifierTest) {
    getByIdentifierTest.test('get registration by identifier', function (assert) {
      let payload = { identifier: 'dfsp2', name: 'My DFSP' }
      createRegistration(payload)
        .then((registration) => {
          Model.getByIdentifier(registration.identifier)
            .then((found) => {
              assert.notEqual(found, registration)
              assert.equal(found.registrationId, registration.registrationId)
              assert.equal(found.registrationUuid, found.registrationUuid)
              assert.equal(found.identifier, registration.identifier)
              assert.equal(found.name, registration.name)
              assert.deepEqual(found.createdDate, registration.createdDate)
              assert.end()
            })
        })
    })

    getByIdentifierTest.end()
  })

  modelTest.end()
})

function createRegistration (payload) {
  return Model.create(payload)
}
