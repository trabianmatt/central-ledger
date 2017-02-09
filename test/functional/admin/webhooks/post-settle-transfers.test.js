'use strict'

const Test = require('tape')
const Base = require('../../base')
const Fixtures = require('../../../fixtures')

Test('POST /webhooks/settle-transfers', settleTest => {
  settleTest.test('should settle transfers', test => {
    let transferId = Fixtures.generateTransferId()
    let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(Base.account1Name, '50'), Fixtures.buildDebitOrCredit(Base.account2Name, '50'))

    Base.prepareTransfer(transferId, transfer)
      .then(() => Base.fulfillTransfer(transferId, 'oAKAAA'))
      .then(() => {
        Base.postAdmin('/webhooks/settle-transfers', {})
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
