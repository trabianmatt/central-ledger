'use strict'

const Test = require('tape')
const Base = require('../../base')

Test('PUT /transfer/:id/fulfillment', putTest => {
  putTest.test('should fulfill a transfer', test => {
    let fulfillment = 'cf:0:_v8'
    let account1Name = Base.generateAccountName()
    let account2Name = Base.generateAccountName()
    let transferId = Base.generateTransferId()

    Base.createAccount(account1Name)
    .then(() => Base.createAccount(account2Name))
    .then(() => Base.prepareTransfer(transferId, Base.buildTransfer(transferId, Base.buildDebitOrCredit(account1Name, '25'), Base.buildDebitOrCredit(account2Name, '25'))))
    .then(() => {
      Base.fulfillTransfer(transferId, fulfillment)
        .expect(200, function (err, res) {
          if (err) return test.end(err)
          test.equal(res.text, fulfillment)
          test.end()
        })
        .expect('Content-Type', 'text/plain; charset=utf-8')
    })
  })

  putTest.test('should return error when fulfilling non-existing transfer', test => {
    let fulfillment = 'cf:0:_v8'
    let transferId = Base.generateTransferId()
    Base.put(`/transfers/${transferId}/fulfillment`, fulfillment, 'text/plain')
      .expect(404, function (err, res) {
        if (err) return test.end(err)
        test.equal(res.body.id, 'NotFoundError')
        test.equal(res.body.message, 'The requested resource could not be found.')
        test.pass()
        test.end()
      })
  })

  putTest.test('should return fulfillment when fulfilling already fulfilled transfer', test => {
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
      Base.fulfillTransfer(transferId, fulfillment)
        .expect(200, function (err, res) {
          if (err) return test.end(err)
          test.equal(res.text, fulfillment)
          test.end()
        })
        .expect('Content-Type', 'text/plain; charset=utf-8')
    })
  })

  putTest.end()
})
