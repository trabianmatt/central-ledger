'use strict'

const src = '../../../../src'
const Test = require('tape')
const Model = require(`${src}/api/transfers/model`)
const Fixtures = require('../../../fixtures')

Test('transfer model', function (modelTest) {
  modelTest.test('prepare should', function (prepareTest) {
    prepareTest.test('prepare a transfer', function (assert) {
      let transferId = Fixtures.generateTransferId()
      let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(Fixtures.generateAccountName(), '50', { interledger: 'blah', path: 'blah' }), Fixtures.buildDebitOrCredit(Fixtures.generateAccountName(), '50', { interledger: 'blah', path: 'blah' }))

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

    prepareTest.end()
  })

  modelTest.test('fulfill should', function (fulfillTest) {
    let fulfillment = 'cf:0:_v8'

    fulfillTest.test('fulfill a transfer', function (assert) {
      let transferId = Fixtures.generateTransferId()
      let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(Fixtures.generateAccountName(), '50'), Fixtures.buildDebitOrCredit(Fixtures.generateAccountName(), '50'))

      Model.prepare(transfer)
        .then(prepared => Model.fulfill({ id: transferId, fulfillment: fulfillment }))
        .then(fulfilled => {
          assert.equal(fulfilled, fulfillment)
          assert.end()
        })
    })

    fulfillTest.end()
  })

  modelTest.test('reject should', function (rejectTest) {
    let rejectionReason = 'reject this transfer'

    rejectTest.test('reject a transfer', function (assert) {
      let transferId = Fixtures.generateTransferId()
      let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(Fixtures.generateAccountName(), '50'), Fixtures.buildDebitOrCredit(Fixtures.generateAccountName(), '50'))

      Model.prepare(transfer)
        .then(prepared => Model.reject({ id: transferId, rejection_reason: rejectionReason }))
        .then(rejected => {
          assert.equal(rejected, rejectionReason)
          assert.end()
        })
    })

    rejectTest.end()
  })

  modelTest.end()
})
