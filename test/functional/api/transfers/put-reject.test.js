'use strict'

const Test = require('tape')
const Base = require('../../base')
const Fixtures = require('../../../fixtures')
const State = require('../../../../src/domain/transfer/state')

Test('PUT /transfers/:id/reject', putTest => {
  putTest.test('should reject a transfer', test => {
    let reason = 'rejection reason'

    let account1Name = Fixtures.generateAccountName()
    let account2Name = Fixtures.generateAccountName()
    let transferId = Fixtures.generateTransferId()
    let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(account1Name, '25'), Fixtures.buildDebitOrCredit(account2Name, '25'))

    Base.createAccount(account1Name)
      .then(() => Base.createAccount(account2Name))
      .then(() => Base.prepareTransfer(transferId, transfer))
      .delay(100)
      .then(() => {
        Base.rejectTransfer(transferId, reason)
          .expect(200)
          .expect('Content-Type', /json/)
          .then(res => {
            test.equal(res.body.id, transfer.id)
            test.equal(res.body.ledger, transfer.ledger)
            test.equal(res.body.debits[0].account, transfer.debits[0].account)
            test.equal(res.body.debits[0].amount, parseInt(transfer.debits[0].amount))
            test.equal(res.body.credits[0].account, transfer.credits[0].account)
            test.equal(res.body.credits[0].amount, parseInt(transfer.credits[0].amount))
            test.equal(res.body.execution_condition, transfer.execution_condition)
            test.equal(res.body.expires_at, transfer.expires_at)
            test.equal(res.body.state, State.REJECTED)
            test.ok(res.body.timeline.prepared_at)
            test.equal(res.body.timeline.hasOwnProperty('executed_at'), false)
            test.ok(res.body.timeline.rejected_at)
            test.equal(res.body.rejection_reason, reason)
            test.end()
          })
      })
  })

  putTest.test('should return reason when rejecting a rejected transfer', test => {
    let reason = 'some reason'

    let account1Name = Fixtures.generateAccountName()
    let account2Name = Fixtures.generateAccountName()
    let transferId = Fixtures.generateTransferId()
    let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(account1Name, '25'), Fixtures.buildDebitOrCredit(account2Name, '25'))

    Base.createAccount(account1Name)
      .then(() => Base.createAccount(account2Name))
      .then(() => Base.prepareTransfer(transferId, transfer))
      .delay(100)
      .then(() => Base.rejectTransfer(transferId, reason))
      .delay(100)
      .then(() => {
        Base.rejectTransfer(transferId, reason)
          .expect(200)
          .expect('Content-Type', /json/)
          .then(res => {
            test.equal(res.body.id, transfer.id)
            test.equal(res.body.ledger, transfer.ledger)
            test.equal(res.body.debits[0].account, transfer.debits[0].account)
            test.equal(res.body.debits[0].amount, parseInt(transfer.debits[0].amount))
            test.equal(res.body.credits[0].account, transfer.credits[0].account)
            test.equal(res.body.credits[0].amount, parseInt(transfer.credits[0].amount))
            test.equal(res.body.execution_condition, transfer.execution_condition)
            test.equal(res.body.expires_at, transfer.expires_at)
            test.equal(res.body.state, State.REJECTED)
            test.ok(res.body.timeline.prepared_at)
            test.equal(res.body.timeline.hasOwnProperty('executed_at'), false)
            test.ok(res.body.timeline.rejected_at)
            test.equal(res.body.rejection_reason, reason)
            test.end()
          })
      })
  })

  putTest.test('should return error when rejecting fulfulled transfer', test => {
    let reason = 'some reason'
    let transferId = Fixtures.generateTransferId()
    let fulfillment = 'oAKAAA'

    let account1Name = Fixtures.generateAccountName()
    let account2Name = Fixtures.generateAccountName()
    let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(account1Name, '25'), Fixtures.buildDebitOrCredit(account2Name, '25'))

    Base.createAccount(account1Name)
      .then(() => Base.createAccount(account2Name))
      .then(() => Base.prepareTransfer(transferId, transfer))
      .delay(100)
      .then(() => Base.fulfillTransfer(transferId, fulfillment))
      .delay(100)
      .then(() => {
        Base.rejectTransfer(transferId, reason)
          .expect(422)
          .expect('Content-Type', /json/)
          .then(res => {
            test.equal(res.body.id, 'UnpreparedTransferError')
            test.equal(res.body.message, 'The provided entity is syntactically correct, but there is a generic semantic problem with it.')
            test.end()
          })
      })
  })

  putTest.end()
})
