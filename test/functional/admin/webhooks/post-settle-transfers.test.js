'use strict'

const Test = require('tape')
const Base = require('../../base')
const Fixtures = require('../../../fixtures')

Test('POST /webhooks/settle-transfers', settleTest => {
  settleTest.test('should settle transfer and fees', test => {
    let transferId = Fixtures.generateTransferId()
    let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(Base.account1Name, '101.00'), Fixtures.buildDebitOrCredit(Base.account2Name, '101.00'))
    const charge = {
      name: 'settleChargeName',
      charge_type: 'fee',
      rate_type: 'flat',
      rate: '1.00',
      minimum: '100.00',
      maximum: '102.00',
      code: '003',
      is_active: true,
      payer: 'sender',
      payee: 'receiver'
    }

    Base.createCharge(charge)
      .then(() => Base.prepareTransfer(transferId, transfer))
      .then(() => Base.fulfillTransfer(transferId, 'oAKAAA'))
      .then(() => {
        Base.postAdmin('/webhooks/settle-transfers', {})
          .expect(200)
          .expect('Content-Type', /json/)
          .then(res => {
            test.ok(res.body.transfers.includes(transferId))
            test.equal(res.body.fees.length, 1)
            test.end()
          })
      })
  })

  settleTest.end()
})
