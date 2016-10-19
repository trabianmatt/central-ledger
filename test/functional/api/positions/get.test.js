'use strict'

const Test = require('tape')
const Base = require('../../base')

Test('GET /positions', getTest => {
  getTest.test('should return net positions', test => {
    let fulfillment = 'cf:0:_v8'
    let account1Name = Base.generateAccountName()
    let account2Name = Base.generateAccountName()
    let account3Name = Base.generateAccountName()

    let transfer1Id = Base.generateTransferId()
    let transfer2Id = Base.generateTransferId()
    let transfer3Id = Base.generateTransferId()

    Base.createAccount(account1Name)
    .then(() => Base.createAccount(account2Name))
    .then(() => Base.createAccount(account3Name))
    .then(() => Base.prepareTransfer(transfer1Id, Base.buildTransfer(transfer1Id, Base.buildDebitOrCredit(account1Name, '25'), Base.buildDebitOrCredit(account2Name, '25'))))
    .then(() => Base.fulfillTransfer(transfer1Id, fulfillment))
    .then(() => Base.prepareTransfer(transfer2Id, Base.buildTransfer(transfer2Id, Base.buildDebitOrCredit(account1Name, '10'), Base.buildDebitOrCredit(account3Name, '10'))))
    .then(() => Base.fulfillTransfer(transfer2Id, fulfillment))
    .then(() => Base.prepareTransfer(transfer3Id, Base.buildTransfer(transfer3Id, Base.buildDebitOrCredit(account3Name, '15'), Base.buildDebitOrCredit(account2Name, '15'))))
    .then(() => Base.fulfillTransfer(transfer3Id, fulfillment))
    .then(() => {
      Base.get('/positions')
        .expect(200, function (err, res) {
          if (err) test.end(err)
          test.deepEqual(Base.findAccountPositions(res.body.positions, account1Name), Base.buildAccountPosition(account1Name, 35, 0))
          test.deepEqual(Base.findAccountPositions(res.body.positions, account2Name), Base.buildAccountPosition(account2Name, 0, 40))
          test.deepEqual(Base.findAccountPositions(res.body.positions, account3Name), Base.buildAccountPosition(account3Name, 15, 10))
          test.end()
        })
        .expect('Content-Type', /json/)
    })
  })

  getTest.end()
})
