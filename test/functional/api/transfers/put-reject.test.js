'use strict'

const Test = require('tape')
const Base = require('../../base')
const Fixtures = require('../../../fixtures')
const RejectionType = require('../../../../src/domain/transfer/rejection-type')
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
      .then(() => {
        Base.rejectTransfer(transferId, reason)
        .expect(200, (err, res) => {
          if (err) test.end(err)
          test.equal(res.text, reason)
          test.end()
        })
        .expect('Content-Type', 'text/plain; charset=utf-8')
      })
  })

  putTest.test('should set rejection_reason to canceled', test => {
    let reason = 'rejection reason'

    let account1Name = Fixtures.generateAccountName()
    let account2Name = Fixtures.generateAccountName()
    let transferId = Fixtures.generateTransferId()
    let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(account1Name, '25'), Fixtures.buildDebitOrCredit(account2Name, '25'))
    Base.createAccount(account1Name)
      .then(() => Base.createAccount(account2Name))
      .then(() => Base.prepareTransfer(transferId, transfer))
      .then(() => Base.rejectTransfer(transferId, reason))
      .then(() => {
        Base.getTransfer(transferId)
          .expect(200, (err, res) => {
            if (err) test.end(err)
            test.equal(res.body.rejection_reason, RejectionType.CANCELED)
            test.equal(res.body.state, State.REJECTED)
            test.end()
          })
      })
  })

  putTest.test('should return reason when rejecting a rejected transfer', test => {
    let reason = 'some reason'
    let transferId = Fixtures.generateTransferId()

    let account1Name = Fixtures.generateAccountName()
    let account2Name = Fixtures.generateAccountName()
    let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(account1Name, '25'), Fixtures.buildDebitOrCredit(account2Name, '25'))

    Base.createAccount(account1Name)
      .then(() => Base.createAccount(account2Name))
      .then(() => Base.prepareTransfer(transferId, transfer))
      .then(() => Base.rejectTransfer(transferId, reason))
      .then(() => {
        Base.rejectTransfer(transferId, reason)
        .expect(200, (err, res) => {
          if (err) test.end(err)
          test.equal(res.text, reason)
          test.end()
        })
        .expect('Content-Type', 'text/plain; charset=utf-8')
      })
  })

  putTest.test('should return error when rejecting fulfulled transfer', test => {
    let reason = 'some reason'
    let transferId = Fixtures.generateTransferId()
    let fulfillment = 'cf:0:_v8'

    let account1Name = Fixtures.generateAccountName()
    let account2Name = Fixtures.generateAccountName()
    let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(account1Name, '25'), Fixtures.buildDebitOrCredit(account2Name, '25'))

    Base.createAccount(account1Name)
      .then(() => Base.createAccount(account2Name))
      .then(() => Base.prepareTransfer(transferId, transfer))
      .then(() => Base.fulfillTransfer(transferId, fulfillment))
      .then(() => {
        Base.rejectTransfer(transferId, reason)
        .expect(422, (err, res) => {
          if (err) return test.end(err)
          test.equal(res.body.id, 'UnprocessableEntityError')
          test.equal(res.body.message, 'The provided entity is syntactically correct, but there is a generic semantic problem with it.')
          test.end()
        })
        .expect('Content-Type', /json/)
      })
  })

  putTest.end()
})
