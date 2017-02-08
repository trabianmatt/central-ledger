'use strict'

const Test = require('tape')
const Base = require('../../base')
const Fixtures = require('../../../fixtures')

Test('GET /transfers/:id/fulfillment', getTest => {
  getTest.test('should return fulfillment for transfer', test => {
    const fulfillment = 'oAKAAA'
    const account1Name = Fixtures.generateAccountName()
    const account2Name = Fixtures.generateAccountName()
    const transferId = Fixtures.generateTransferId()
    const transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(account1Name, '25'), Fixtures.buildDebitOrCredit(account2Name, '25'))

    Base.createAccount(account1Name)
      .then(() => Base.createAccount(account2Name))
      .then(() => Base.prepareTransfer(transferId, transfer))
      .then(() => Base.fulfillTransfer(transferId, fulfillment))
      .delay(200)
      .then(() => {
        Base.getFulfillment(transferId)
          .expect(200)
          .expect('Content-Type', 'text/plain; charset=utf-8')
          .then(res => {
            test.equal(res.text, fulfillment)
            test.end()
          })
      })
  })

  getTest.test('should return error is transfer does not exist', test => {
    const transferId = Fixtures.generateTransferId()

    Base.getFulfillment(transferId)
          .expect(404)
          .then(res => {
            test.equal(res.body.id, 'TransferNotFoundError')
            test.equal(res.body.message, 'This transfer does not exist')
            test.end()
          })
  })

  getTest.test('should return error when retrieving fulfillment if transfer not executed', test => {
    const account1Name = Fixtures.generateAccountName()
    const account2Name = Fixtures.generateAccountName()
    const transferId = Fixtures.generateTransferId()
    const transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(account1Name, '50'), Fixtures.buildDebitOrCredit(account2Name, '50'))

    Base.createAccount(account1Name)
      .then(() => Base.createAccount(account2Name))
      .then(() => Base.prepareTransfer(transferId, transfer))
      .delay(200)
      .then(() => {
        Base.getFulfillment(transferId)
          .expect(404)
          .then(res => {
            test.equal(res.body.id, 'MissingFulfillmentError')
            test.equal(res.body.message, 'This transfer has not yet been fulfilled')
            test.end()
          })
      })
  })

  getTest.test('should return error when retrieving fulfillment of rejected transfer', test => {
    const account1Name = Fixtures.generateAccountName()
    const account2Name = Fixtures.generateAccountName()
    const transferId = Fixtures.generateTransferId()
    const transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(account1Name, '50'), Fixtures.buildDebitOrCredit(account2Name, '50'))

    Base.createAccount(account1Name)
      .then(() => Base.createAccount(account2Name))
      .then(() => Base.prepareTransfer(transferId, transfer))
      .then(() => Base.rejectTransfer(transferId, 'testing things'))
      .then(() => {
        Base.getFulfillment(transferId)
          .expect(422)
          .then(res => {
            test.equal(res.body.id, 'AlreadyRolledBackError')
            test.equal(res.body.message, 'This transfer has already been rejected')
            test.end()
          })
      })
      .catch(e => test.end())
  })

  getTest.test('should return error if transfer not conditional', test => {
    const account1Name = Fixtures.generateAccountName()
    const account2Name = Fixtures.generateAccountName()
    const transferId = Fixtures.generateTransferId()
    const transfer = Fixtures.buildUnconditionalTransfer(transferId, Fixtures.buildDebitOrCredit(account1Name, '50'), Fixtures.buildDebitOrCredit(account2Name, '50'))

    Base.createAccount(account1Name)
      .then(() => Base.createAccount(account2Name))
      .then(() => Base.prepareTransfer(transferId, transfer))
      .then(() => {
        Base.getFulfillment(transferId)
          .expect(422)
          .then(res => {
            test.equal(res.body.id, 'TransferNotConditionalError')
            test.equal(res.body.message, 'Transfer is not conditional')
            test.end()
          })
      })
  })

  getTest.end()
})
