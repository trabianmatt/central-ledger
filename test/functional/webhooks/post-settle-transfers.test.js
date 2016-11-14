'use strict'

const Test = require('tape')
const Base = require('../base')
const Fixtures = require('../../fixtures')

Test('POST /webhooks/settle-transfers', settleTest => {
  settleTest.test('should settle transfers', test => {
    let account1Name = Fixtures.generateAccountName()
    let account2Name = Fixtures.generateAccountName()
    let transferId = Fixtures.generateTransferId()
    let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(account1Name, '50'), Fixtures.buildDebitOrCredit(account2Name, '50'))

    Base.createAccount(account1Name)
      .then(() => Base.createAccount(account2Name))
      .then(() => Base.prepareTransfer(transferId, transfer))
      .delay(100)
      .then(() => Base.fulfillTransfer(transferId, 'cf:0:_v8'))
      .delay(100)
      .then(() => {
        Base.post('/webhooks/settle-transfers', {})
          .expect(200)
          .expect('Content-Type', /json/)
          .then(res => {
            test.ok(res.body.includes(transferId))
            test.end()
          })
      })
  })

  settleTest.end()
})
