'use strict'

const Test = require('tape')
const Base = require('../../base')
const Fixtures = require('../../../fixtures')
const TransferState = require('../../../../src/domain/transfer/state')
const Moment = require('moment')
const amount = '50.00'

Test('PUT /transfers', putTest => {
  putTest.test('should prepare a transfer', test => {
    const account1Name = Fixtures.generateAccountName()
    const account2Name = Fixtures.generateAccountName()
    const transferId = Fixtures.generateTransferId()
    const transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(account1Name, amount, { interledger: 'blah', path: 'blah' }), Fixtures.buildDebitOrCredit(account2Name, amount, { interledger: 'blah', path: 'blah' }))

    Base.createAccount(account1Name)
      .then(() => Base.createAccount(account2Name))
      .then(() => {
        Base.prepareTransfer(transferId, transfer)
          .expect(201)
          .expect('Content-Type', /json/)
          .then(res => {
            test.equal(res.body.id, transfer.id)
            test.equal(res.body.ledger, transfer.ledger)
            test.equal(res.body.debits[0].account, transfer.debits[0].account)
            test.equal(res.body.debits[0].amount, amount)
            test.equal(res.body.credits[0].account, transfer.credits[0].account)
            test.equal(res.body.credits[0].amount, amount)
            test.equal(res.body.execution_condition, transfer.execution_condition)
            test.equal(res.body.expires_at, transfer.expires_at)
            test.equal(res.body.state, TransferState.PREPARED)
            test.ok(res.body.timeline.prepared_at)
            test.equal(res.body.timeline.hasOwnProperty('executed_at'), false)
            test.equal(res.body.timeline.hasOwnProperty('rejected_at'), false)
            test.end()
          })
      })
  })

  putTest.test('should prepare and execute unconditional transfer', test => {
    const account1Name = Fixtures.generateAccountName()
    const account2Name = Fixtures.generateAccountName()
    const transferId = Fixtures.generateTransferId()
    const transfer = Fixtures.buildUnconditionalTransfer(transferId, Fixtures.buildDebitOrCredit(account1Name, amount, { interledger: 'blah', path: 'blah' }), Fixtures.buildDebitOrCredit(account2Name, amount, { interledger: 'blah', path: 'blah' }))

    Base.createAccount(account1Name)
      .then(() => Base.createAccount(account2Name))
      .then(() => {
        Base.prepareTransfer(transferId, transfer)
          .expect(201)
          .expect('Content-Type', /json/)
          .then(res => {
            test.equal(res.body.id, transfer.id)
            test.equal(res.body.ledger, transfer.ledger)
            test.equal(res.body.debits[0].account, transfer.debits[0].account)
            test.equal(res.body.debits[0].amount, amount)
            test.equal(res.body.credits[0].account, transfer.credits[0].account)
            test.equal(res.body.credits[0].amount, amount)
            test.equal(res.body.hasOwnProperty('execution_condition'), false)
            test.equal(res.body.hasOwnProperty('expires_at'), false)
            test.equal(res.body.state, TransferState.EXECUTED)
            test.ok(res.body.timeline.prepared_at)
            test.ok(res.body.timeline.executed_at)
            test.equal(res.body.timeline.hasOwnProperty('rejected_at'), false)
            test.end()
          })
      })
  })

  putTest.test('should return transfer details when preparing existing transfer', test => {
    let account1Name = Fixtures.generateAccountName()
    let account2Name = Fixtures.generateAccountName()
    let transferId = Fixtures.generateTransferId()
    let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(account1Name, amount), Fixtures.buildDebitOrCredit(account2Name, amount))

    Base.createAccount(account1Name)
      .then(() => Base.createAccount(account2Name))
      .then(() => Base.prepareTransfer(transferId, transfer))
      .delay(100)
      .then(() => {
        Base.prepareTransfer(transferId, transfer)
          .expect(200)
          .expect('Content-Type', /json/)
          .then(res => {
            test.equal(res.body.id, transfer.id)
            test.equal(res.body.ledger, transfer.ledger)
            test.equal(res.body.debits[0].account, transfer.debits[0].account)
            test.equal(res.body.debits[0].amount, amount)
            test.equal(res.body.credits[0].account, transfer.credits[0].account)
            test.equal(res.body.credits[0].amount, amount)
            test.equal(res.body.execution_condition, transfer.execution_condition)
            test.equal(res.body.expires_at, transfer.expires_at)
            test.equal(res.body.state, TransferState.PREPARED)
            test.ok(res.body.timeline.prepared_at)
            test.equal(res.body.timeline.hasOwnProperty('executed_at'), false)
            test.equal(res.body.timeline.hasOwnProperty('rejected_at'), false)
            test.end()
          })
      })
  })

  putTest.test('should return error when preparing existing transfer with changed properties', test => {
    let account1Name = Fixtures.generateAccountName()
    let account2Name = Fixtures.generateAccountName()
    let transferId = Fixtures.generateTransferId()
    let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(account1Name, amount), Fixtures.buildDebitOrCredit(account2Name, amount))

    Base.createAccount(account1Name)
      .then(() => Base.createAccount(account2Name))
      .then(() => Base.prepareTransfer(transferId, transfer))
      .delay(100)
      .then(() => {
        transfer.credits.push(Fixtures.buildDebitOrCredit(account1Name, amount))

        Base.prepareTransfer(transferId, transfer)
          .expect(422)
          .expect('Content-Type', /json/)
          .then(res => {
            test.equal(res.body.id, 'AlreadyExistsError')
            test.equal(res.body.message, 'The specified entity already exists and may not be modified.')
            test.end()
          })
      })
  })

  putTest.test('return error when preparing fulfilled transfer', test => {
    let account1Name = Fixtures.generateAccountName()
    let account2Name = Fixtures.generateAccountName()
    let transferId = Fixtures.generateTransferId()
    let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(account1Name, amount), Fixtures.buildDebitOrCredit(account2Name, amount))

    Base.createAccount(account1Name)
      .then(() => Base.createAccount(account2Name))
      .then(() => Base.prepareTransfer(transferId, transfer))
      .delay(100)
      .then(() => Base.fulfillTransfer(transferId, 'oAKAAA'))
      .delay(100)
      .then(() => {
        Base.prepareTransfer(transferId, transfer)
          .expect(422)
          .expect('Content-Type', /json/)
          .then(res => {
            test.equal(res.body.id, 'AlreadyExistsError')
            test.equal(res.body.message, 'The specified entity already exists and may not be modified.')
            test.end()
          })
      })
  })

  putTest.test('return error when preparing transfer with expired date', test => {
    let account1Name = Fixtures.generateAccountName()
    let account2Name = Fixtures.generateAccountName()
    let transferId = Fixtures.generateTransferId()
    let expiredDate = Moment.utc().add(-10, 'minutes')
    let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(account1Name, amount), Fixtures.buildDebitOrCredit(account2Name, amount), expiredDate)

    Base.createAccount(account1Name)
      .then(() => Base.createAccount(account2Name))
      .then(() => Base.prepareTransfer(transferId, transfer))
      .delay(100)
      .then(() => Base.fulfillTransfer(transferId, 'oAKAAA'))
      .delay(100)
      .then(() => {
        Base.prepareTransfer(transferId, transfer)
          .expect(422)
          .expect('Content-Type', /json/)
          .then(res => {
            test.equal(res.body.id, 'ValidationError')
            test.equal(res.body.message, `expires_at date: ${expiredDate.toISOString()} has already expired.`)
            test.end()
          })
      })
  })

  putTest.end()
})
