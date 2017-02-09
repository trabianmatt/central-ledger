'use strict'

const Test = require('tape')
const Base = require('../../base')
const Fixtures = require('../../../fixtures')

Test('GET /positions', getTest => {
  getTest.test('should return net positions', test => {
    let fulfillment = 'oAKAAA'
    let account1Name = Fixtures.generateAccountName()
    let account2Name = Fixtures.generateAccountName()
    let account3Name = Fixtures.generateAccountName()
    let account4Name = Fixtures.generateAccountName()

    let transfer1Id = Fixtures.generateTransferId()
    let transfer2Id = Fixtures.generateTransferId()
    let transfer3Id = Fixtures.generateTransferId()

    Base.createAccount(account1Name)
    .then(() => Base.createAccount(account2Name))
    .then(() => Base.createAccount(account3Name))
    .then(() => Base.createAccount(account4Name))
    .then(() => Base.prepareTransfer(transfer1Id, Fixtures.buildTransfer(transfer1Id, Fixtures.buildDebitOrCredit(account1Name, '25'), Fixtures.buildDebitOrCredit(account2Name, '25'))))
    .then(() => Base.fulfillTransfer(transfer1Id, fulfillment))
    .then(() => Base.prepareTransfer(transfer2Id, Fixtures.buildTransfer(transfer2Id, Fixtures.buildDebitOrCredit(account1Name, '10'), Fixtures.buildDebitOrCredit(account3Name, '10'))))
    .then(() => Base.fulfillTransfer(transfer2Id, fulfillment))
    .then(() => Base.prepareTransfer(transfer3Id, Fixtures.buildTransfer(transfer3Id, Fixtures.buildDebitOrCredit(account3Name, '15'), Fixtures.buildDebitOrCredit(account2Name, '15'))))
    .then(() => Base.fulfillTransfer(transfer3Id, fulfillment))
    .then(() => {
      Base.getApi('/positions')
        .expect(200)
        .expect('Content-Type', /json/)
        .then(res => {
          test.deepEqual(Fixtures.findAccountPositions(res.body.positions, account1Name), Fixtures.buildAccountPosition(account1Name, 35, 0))
          test.deepEqual(Fixtures.findAccountPositions(res.body.positions, account2Name), Fixtures.buildAccountPosition(account2Name, 0, 40))
          test.deepEqual(Fixtures.findAccountPositions(res.body.positions, account3Name), Fixtures.buildAccountPosition(account3Name, 15, 10))
          test.deepEqual(Fixtures.findAccountPositions(res.body.positions, account4Name), Fixtures.buildAccountPosition(account4Name, 0, 0))
          test.end()
        })
    })
  })

  getTest.end()
})
