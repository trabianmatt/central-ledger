'use strict'

const Test = require('tape')
const Fixtures = require('../../../fixtures')
const Model = require('../../../../src/domain/account/model')

function createAccount (name, hashedPassword = 'password') {
  const payload = { name, hashedPassword }
  return Model.create(payload)
}

Test('accounts model', function (modelTest) {
  modelTest.test('create should', function (createTest) {
    createTest.test('create a new account', function (assert) {
      const accountName = Fixtures.generateAccountName()
      const hashedPassword = 'some-password'
      createAccount(accountName, hashedPassword)
        .then((account) => {
          assert.equal(account.name, accountName)
          assert.ok(account.createdDate)
          assert.ok(account.accountId)
          assert.equal(account.isDisabled, false)
          assert.end()
        })
    })

    createTest.end()
  })

  modelTest.test('getByName should', function (getByNameTest) {
    getByNameTest.test('get account by name', function (assert) {
      const accountName = Fixtures.generateAccountName()
      createAccount(accountName)
        .then((account) => {
          Model.getByName(account.name)
            .then((found) => {
              assert.notEqual(found, account)
              assert.equal(found.name, account.name)
              assert.deepEqual(found.createdDate, account.createdDate)
              assert.equal(found.isDisabled, false)
              assert.end()
            })
        })
    })

    getByNameTest.end()
  })

  modelTest.test('getById should', function (getByIdTest) {
    getByIdTest.test('get account by id', function (assert) {
      const accountName = Fixtures.generateAccountName()
      createAccount(accountName)
        .then((account) => {
          Model.getById(account.accountId)
            .then((found) => {
              assert.notEqual(found, account)
              assert.equal(found.accountId, account.accountId)
              assert.deepEqual(found.createdDate, account.createdDate)
              assert.equal(found.isDisabled, false)
              assert.end()
            })
        })
    })

    getByIdTest.end()
  })

  modelTest.test('getAll should', function (getAllTest) {
    getAllTest.test('return all accounts', function (assert) {
      const account1Name = Fixtures.generateAccountName()
      const account2Name = Fixtures.generateAccountName()
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

  modelTest.test('update should', function (updateTest) {
    updateTest.test('update account isDisabled field', function (assert) {
      const accountName = Fixtures.generateAccountName()
      const isDisabled = true
      createAccount(accountName)
        .then((account) => {
          Model.update(account, isDisabled)
            .then((updated) => {
              assert.notEqual(updated, account)
              assert.equal(updated.name, account.name)
              assert.deepEqual(updated.createdDate, account.createdDate)
              assert.equal(updated.isDisabled, isDisabled)
              assert.end()
            })
        })
    })

    updateTest.end()
  })

  modelTest.test('retrieveUserCredentials should', function (retrieveUserCredentialsTest) {
    retrieveUserCredentialsTest.test('return user credentials for a given account', function (assert) {
      const account = Fixtures.generateAccountName()
      const password = 'password'
      createAccount(account, password)
        .then((createdAccount) => Model.retrieveUserCredentials(createdAccount)
        .then((userCredentials) => {
          assert.equal(userCredentials.accountId, createdAccount.accountId)
          assert.equal(userCredentials.password, password)
          assert.end()
        }))
    })

    retrieveUserCredentialsTest.end()
  })

  modelTest.end()
})
