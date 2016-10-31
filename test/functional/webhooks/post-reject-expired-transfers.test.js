'use strict'

const Test = require('tape')
const Base = require('../base')
const Fixtures = require('../../fixtures')
const RejectionType = require('../../../src/domain/transfer/rejection-type')
const State = require('../../../src/domain/transfer/state')

let pastDate = () => {
  let d = new Date()
  d.setTime(d.getTime() - 86400000)
  return d
}

Test('POST /webhooks/reject-expired-transfers', rejectTest => {
  rejectTest.test('should reject expired transfers', test => {
    let account1Name = Fixtures.generateAccountName()
    let account2Name = Fixtures.generateAccountName()
    let transferId = Fixtures.generateTransferId()
    let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(account1Name, '50'), Fixtures.buildDebitOrCredit(account2Name, '50'), pastDate())

    Base.createAccount(account1Name)
      .then(() => Base.createAccount(account2Name))
      .then(() => Base.prepareTransfer(transferId, transfer))
      .delay(100)
      .then(() => {
        Base.post('/webhooks/reject-expired-transfers', {})
          .expect(200)
          .expect('Content-Type', /json/)
          .then(res => {
            test.deepEqual(res.body, [transferId])
            test.end()
          })
      })
  })

  rejectTest.test('should set rejection_reason to expired', test => {
    let account1Name = Fixtures.generateAccountName()
    let account2Name = Fixtures.generateAccountName()
    let transferId = Fixtures.generateTransferId()
    let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(account1Name, '50'), Fixtures.buildDebitOrCredit(account2Name, '50'), pastDate())

    Base.createAccount(account1Name)
      .then(() => Base.createAccount(account2Name))
      .then(() => Base.prepareTransfer(transferId, transfer))
      .delay(100)
      .then(() => Base.post('/webhooks/reject-expired-transfers', {}))
      .delay(100)
      .then(() => {
        Base.getTransfer(transferId)
          .expect(200)
          .expect('Content-Type', /json/)
          .then(res => {
            test.equal(res.body.rejection_reason, RejectionType.EXPIRED)
            test.equal(res.body.state, State.REJECTED)
            test.end()
          })
      })
  })
  rejectTest.end()
})
