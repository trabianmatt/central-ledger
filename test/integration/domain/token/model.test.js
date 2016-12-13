'use strict'

const Test = require('tape')
const Uuid = require('uuid4')
const P = require('bluebird')
const Fixtures = require('../../../fixtures')
const Model = require('../../../../src/domain/token/model')
const AccountModel = require('../../../../src/domain/account/model')

const createAccount = () => {
  const accountName = Fixtures.generateAccountName()
  return AccountModel.create({ name: accountName })
}

const generateToken = ({ accountId }) => {
  const token = Uuid().toString()
  return Model.create({ accountId, token })
}

Test('Token Model', modelTest => {
  modelTest.test('byAccount should', tokensByAccountTest => {
    tokensByAccountTest.test('return tokens for account', test => {
      P.all([
        createAccount(),
        createAccount()
      ]).then(([account1, account2]) => {
        return P.all([
          generateToken(account1),
          generateToken(account2),
          generateToken(account1)
        ]).then(([token1, token2, token3]) => {
          return Model.byAccount(account1).then((results) => ({ results, token1, token2, token3 }))
        })
      }).then(({ results, token1, token2, token3 }) => {
        test.equal(results.length, 2)
        test.ok(results.find(t => t.token === token1.token))
        test.ok(results.find(t => t.token === token3.token))
        test.notOk(results.find(t => t.token === token2.token))
        test.end()
      })
    })
    tokensByAccountTest.end()
  })

  modelTest.end()
})
