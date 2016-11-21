'use strict'

const Test = require('tape')
const Base = require('../../base')
const Fixtures = require('../../../fixtures')

let pastDate = () => {
  let d = new Date()
  d.setTime(d.getTime() - 86400000)
  return d
}

Test('PUT /transfer/:id/fulfillment', putTest => {
  putTest.test('should fulfill a transfer', test => {
    let fulfillment = 'cf:0:_v8'
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
          .expect('Content-Type', 'text/plain; charset=utf-8')
          .then(res => {
            test.equal(res.text, fulfillment)
            test.end()
          })
      })
  })

  putTest.test('should return error when fulfilling non-existing transfer', test => {
    let fulfillment = 'cf:0:_v8'
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
        Base.fulfillTransfer(transferId, fulfillment)
          .expect(200)
          .expect('Content-Type', 'text/plain; charset=utf-8')
          .then(res => {
            test.equal(res.text, fulfillment)
            test.end()
          })
      })
  })

  putTest.test('should return error when fulfilling expired transfer', test => {
    let fulfillment = 'cf:0:_v8'
    let account1Name = Fixtures.generateAccountName()
    let account2Name = Fixtures.generateAccountName()
    let transferId = Fixtures.generateTransferId()
    let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(account1Name, '25'), Fixtures.buildDebitOrCredit(account2Name, '25'), pastDate())

    Base.createAccount(account1Name)
      .then(() => Base.createAccount(account2Name))
      .then(() => Base.prepareTransfer(transferId, transfer))
      .delay(100)
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
