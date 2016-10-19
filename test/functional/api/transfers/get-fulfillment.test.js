'use strict'

const Test = require('tape')
const Base = require('../../base')

Test('GET /transfers/:id/fulfillment', getTest => {
  getTest.test('should return fulfillment for transfer', test => {
    let fulfillment = 'cf:0:_v8'
    let account1Name = Base.generateAccountName()
    let account2Name = Base.generateAccountName()
    let transferId = Base.generateTransferId()
    let transfer = Base.buildTransfer(transferId, Base.buildDebitOrCredit(account1Name, '25'), Base.buildDebitOrCredit(account2Name, '25'))

    Base.createAccount(account1Name)
    .then(() => Base.createAccount(account2Name))
    .then(() => Base.prepareTransfer(transferId, transfer))
    .then(() => Base.fulfillTransfer(transferId, fulfillment))
    .then(() => {
      Base.get(`/transfers/${transferId}/fulfillment`)
        .expect(200, function (err, res) {
          if (err) return test.end(err)
          test.equal(res.text, fulfillment)
          test.end()
        })
        .expect('Content-Type', 'text/plain; charset=utf-8')
    })
  })

  getTest.test('should return error when retrieving fulfillment if transfer not executed', test => {
    let account1Name = Base.generateAccountName()
    let account2Name = Base.generateAccountName()
    let transferId = Base.generateTransferId()
    let transfer = Base.buildTransfer(transferId, Base.buildDebitOrCredit(account1Name, '50'), Base.buildDebitOrCredit(account2Name, '50'))

    Base.createAccount(account1Name)
    .then(() => Base.createAccount(account2Name))
    .then(() => Base.prepareTransfer(transferId, transfer))
    .then(() => {
      Base.get(`/transfers/${transferId}/fulfillment`)
        .expect(404, function (err, res) {
          if (err) return test.end(err)
          test.equal(res.body.id, 'NotFoundError')
          test.equal(res.body.message, 'The requested resource could not be found.')
          test.pass()
          test.end()
        })
    })
  })

  getTest.end()
})
