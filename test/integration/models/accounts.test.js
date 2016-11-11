'use strict'

const src = '../../../src'
const Test = require('tape')
const Fixtures = require('../../fixtures')
const Model = require(`${src}/models/accounts`)

Test('accounts model', function (modelTest) {
  modelTest.test('create should', function (createTest) {
    createTest.test('create a new account', function (assert) {
      let accountName = Fixtures.generateAccountName()
      createAccount(accountName)
        .then((account) => {
          assert.equal(account.name, accountName)
          assert.ok(account.createdDate)
          assert.end()
        })
    })

    createTest.end()
  })

  modelTest.test('getByName should', function (getByNameTest) {
    getByNameTest.test('get account by name', function (assert) {
      let accountName = Fixtures.generateAccountName()
      createAccount(accountName)
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

  modelTest.test('getById should', function (getByIdTest) {
    getByIdTest.test('get account by id', function (assert) {
      let accountName = Fixtures.generateAccountName()
      createAccount(accountName)
        .then((account) => {
          Model.getById(account.accountId)
            .then((found) => {
              assert.notEqual(found, account)
              assert.equal(found.accountId, account.accountId)
              assert.deepEqual(found.createdDate, account.createdDate)
              assert.end()
            })
        })
    })

    getByIdTest.end()
  })

  modelTest.test('getAll should', function (getAllTest) {
    getAllTest.test('return all accounts', function (assert) {
      let account1Name = Fixtures.generateAccountName()
      let account2Name = Fixtures.generateAccountName()
      createAccount(account1Name)
        .then(() => createAccount(account2Name))
        .then(() => Model.getAll())
        .then((accounts) => {
          assert.ok(accounts.length > 0)
          assert.ok(accounts.find(a => a.name === account1Name))
          assert.ok(accounts.find(a => a.name === account2Name))
          assert.end()
        })
    })

    getAllTest.end()
  })

  modelTest.end()
})

function createAccount (accountName) {
  let payload = { name: accountName }
  return Model.create(payload)
}
