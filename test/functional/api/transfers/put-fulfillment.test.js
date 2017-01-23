'use strict'

const Test = require('tape')
const Base = require('../../base')
const Fixtures = require('../../../fixtures')
const TransferState = require('../../../../src/domain/transfer/state')
const fulfillment = 'oAKAAA'

Test('PUT /transfer/:id/fulfillment', putTest => {
  putTest.test('should fulfill a transfer', test => {
    let account1Name = Fixtures.generateAccountName()
    let account2Name = Fixtures.generateAccountName()
    let transferId = Fixtures.generateTransferId()
    let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(account1Name, '25'), Fixtures.buildDebitOrCredit(account2Name, '25'))

    Base.createAccount(account1Name)
      .then(() => Base.createAccount(account2Name))
      .then(() => Base.prepareTransfer(transferId, transfer))
      .delay(100)
      .then(() => {
        Base.fulfillTransfer(transferId, fulfillment)
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
            test.equal(res.body.state, TransferState.EXECUTED)
            test.ok(res.body.timeline.prepared_at)
            test.ok(res.body.timeline.executed_at)
            test.equal(res.body.timeline.hasOwnProperty('rejected_at'), false)
            test.end()
          })
      })
  })

  putTest.test('should return error when fulfilling non-existing transfer', test => {
    let transferId = Fixtures.generateTransferId()

    Base.put(`/transfers/${transferId}/fulfillment`, fulfillment, 'text/plain')
      .expect(404)
      .then(res => {
        test.equal(res.body.id, 'NotFoundError')
        test.equal(res.body.message, 'The requested resource could not be found.')
        test.pass()
        test.end()
      })
  })

  putTest.test('should return fulfillment when fulfilling already fulfilled transfer', test => {
    let account1Name = Fixtures.generateAccountName()
    let account2Name = Fixtures.generateAccountName()
    let transferId = Fixtures.generateTransferId()
    let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(account1Name, '25'), Fixtures.buildDebitOrCredit(account2Name, '25'))

    Base.createAccount(account1Name)
      .then(() => Base.createAccount(account2Name))
      .then(() => Base.prepareTransfer(transferId, transfer))
      .delay(100)
      .then(() => Base.fulfillTransfer(transferId, fulfillment))
      .delay(100)
      .then(() => {
        Base.fulfillTransfer(transferId, fulfillment)
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
            test.equal(res.body.state, TransferState.EXECUTED)
            test.ok(res.body.timeline.prepared_at)
            test.ok(res.body.timeline.executed_at)
            test.equal(res.body.timeline.hasOwnProperty('rejected_at'), false)
            test.end()
          })
      })
  })

  putTest.test('should return error when fulfilling expired transfer', test => {
    let account1Name = Fixtures.generateAccountName()
    let account2Name = Fixtures.generateAccountName()
    let transferId = Fixtures.generateTransferId()
    let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(account1Name, '25'), Fixtures.buildDebitOrCredit(account2Name, '25'), Fixtures.getMomentToExpire())

    Base.createAccount(account1Name)
      .then(() => Base.createAccount(account2Name))
      .then(() => Base.prepareTransfer(transferId, transfer))
      .delay(3000)
      .then(() => {
        Base.fulfillTransfer(transferId, fulfillment)
          .expect(422)
          .expect('Content-Type', 'application/json; charset=utf-8')
          .then(res => {
            test.equal(res.body.id, 'UnpreparedTransferError')
            test.equal(res.body.message, 'The provided entity is syntactically correct, but there is a generic semantic problem with it.')
            test.pass()
            test.end()
          })
      })
  })

  putTest.end()
})
