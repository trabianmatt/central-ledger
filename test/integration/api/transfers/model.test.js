'use strict'

const src = '../../../../src'
const _ = require('lodash')
const P = require('bluebird')
const Test = require('tape')
const Model = require(`${src}/api/transfers/model`)
const AccountsModel = require(`${src}/models/accounts`)
const Fixtures = require('../../../fixtures')

function createAccounts (accountNames) {
  return P.all(accountNames.map(name => AccountsModel.create({ name: name }))).then(accounts => _.reduce(accounts, (m, acct) => _.set(m, acct.name, acct.accountId), {}))
}

Test('transfer model', function (modelTest) {
  modelTest.test('prepare should', function (prepareTest) {
    prepareTest.test('prepare a transfer', function (assert) {
      let debitAccountName = Fixtures.generateAccountName()
      let creditAccountName = Fixtures.generateAccountName()

      let transfer = Fixtures.buildTransfer(Fixtures.generateTransferId(), Fixtures.buildDebitOrCredit(debitAccountName, '50', { interledger: 'blah', path: 'blah' }), Fixtures.buildDebitOrCredit(creditAccountName, '50', { interledger: 'blah', path: 'blah' }))

      createAccounts([debitAccountName, creditAccountName])
        .then(accountMap => {
          Model.prepare(transfer)
            .then(prepared => {
              assert.equal(prepared.id, transfer.id)
              assert.equal(prepared.ledger, transfer.ledger)
              assert.equal(prepared.debits[0].account, transfer.debits[0].account)
              assert.equal(prepared.debits[0].amount, transfer.debits[0].amount)
              assert.equal(prepared.credits[0].account, transfer.credits[0].account)
              assert.equal(prepared.credits[0].amount, transfer.credits[0].amount)
              assert.equal(prepared.execution_condition, transfer.execution_condition)
              assert.equal(prepared.expires_at, transfer.expires_at)
              assert.end()
            })
        })
    })

    prepareTest.end()
  })

  modelTest.test('fulfill should', function (fulfillTest) {
    let fulfillment = 'cf:0:_v8'

    fulfillTest.test('fulfill a transfer', function (assert) {
      let debitAccountName = Fixtures.generateAccountName()
      let creditAccountName = Fixtures.generateAccountName()

      let transferId = Fixtures.generateTransferId()
      let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(debitAccountName, '50'), Fixtures.buildDebitOrCredit(creditAccountName, '50'))

      createAccounts([debitAccountName, creditAccountName])
        .then(accountMap => {
          Model.prepare(transfer)
            .then(prepared => Model.fulfill({ id: transferId, fulfillment: fulfillment }))
            .then(fulfilled => {
              assert.equal(fulfilled, fulfillment)
              assert.end()
            })
        })
    })

    fulfillTest.end()
  })

  modelTest.test('reject should', function (rejectTest) {
    let rejectionReason = 'reject this transfer'

    rejectTest.test('reject a transfer', function (assert) {
      let debitAccountName = Fixtures.generateAccountName()
      let creditAccountName = Fixtures.generateAccountName()

      let transferId = Fixtures.generateTransferId()
      let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(debitAccountName, '50'), Fixtures.buildDebitOrCredit(creditAccountName, '50'))

      createAccounts([debitAccountName, creditAccountName])
        .then(accountMap => {
          Model.prepare(transfer)
            .then(prepared => Model.reject({ id: transferId, rejection_reason: rejectionReason }))
            .then(rejected => {
              assert.equal(rejected, rejectionReason)
              assert.end()
            })
        })
    })

    rejectTest.end()
  })

  modelTest.end()
})
