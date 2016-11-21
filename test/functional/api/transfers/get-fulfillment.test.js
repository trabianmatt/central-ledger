'use strict'

const Test = require('tape')
const Base = require('../../base')
const Fixtures = require('../../../fixtures')

Test('GET /transfers/:id/fulfillment', getTest => {
  getTest.test('should return fulfillment for transfer', test => {
    let fulfillment = 'cf:0:_v8'
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
        Base.getFulfillment(transferId)
          .expect(200)
          .expect('Content-Type', 'text/plain; charset=utf-8')
          .then(res => {
            test.equal(res.text, fulfillment)
            test.end()
          })
      })
  })

  getTest.test('should return error when retrieving fulfillment if transfer not executed', test => {
    let account1Name = Fixtures.generateAccountName()
    let account2Name = Fixtures.generateAccountName()
    let transferId = Fixtures.generateTransferId()
    let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(account1Name, '50'), Fixtures.buildDebitOrCredit(account2Name, '50'))

    Base.createAccount(account1Name)
      .then(() => Base.createAccount(account2Name))
      .then(() => Base.prepareTransfer(transferId, transfer))
      .delay(100)
      .then(() => {
        Base.getFulfillment(transferId)
          .expect(404)
          .then(res => {
            test.equal(res.body.id, 'NotFoundError')
            test.equal(res.body.message, 'The requested resource could not be found.')
            test.pass()
            test.end()
          })
      })
  })

  getTest.end()
})
