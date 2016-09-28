'use strict'

const Test = require('tape')
const Model = require('../../../src/models/accounts')

Test('accounts model', function (modelTest) {
  modelTest.test('create should', function (createTest) {
    createTest.test('create a new account', function (assert) {
      let payload = { name: 'dfsp1' }
      createAccount(payload)
        .then((account) => {
          assert.equal(account.name, payload.name)
          assert.ok(account.createdDate)
          assert.end()
        })
    })

    createTest.end()
  })

  modelTest.test('getByName should', function (getByNameTest) {
    getByNameTest.test('get account by name', function (assert) {
      let payload = { name: 'dfsp2' }
      createAccount(payload)
        .then((account) => {
          Model.getByName(account.name)
            .then((found) => {
              assert.notEqual(found, account)
              assert.equal(found.name, account.name)
              assert.deepEqual(found.createdDate, account.createdDate)
              assert.end()
            })
        })
    })

    getByNameTest.end()
  })

  modelTest.end()
})

function createAccount (payload) {
  return Model.create(payload)
}
