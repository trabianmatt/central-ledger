'use strict'

const Test = require('tape')
const Base = require('../base')
const Fixtures = require('../../fixtures')

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
      .then(() => {
        Base.post('/webhooks/reject-expired-transfers', {})
          .expect(200, (err, res) => {
            if (err) test.end(err)
            test.deepEqual(res.body, [transferId])
            test.end()
          })
          .expect('Content-Type', /json/)
      })
  })
  rejectTest.end()
})
