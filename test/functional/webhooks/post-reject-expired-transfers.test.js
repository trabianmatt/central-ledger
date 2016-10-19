'use strict'

const Test = require('tape')
const Base = require('../base')

let pastDate = () => {
  let d = new Date()
  d.setTime(d.getTime() - 86400000)
  return d
}

Test('POST /webhooks/reject-expired-transfers', rejectTest => {
  rejectTest.test('should reject expired transfers', test => {
    let account1Name = Base.generateAccountName()
    let account2Name = Base.generateAccountName()
    let transferId = Base.generateTransferId()
    let transfer = Base.buildTransfer(transferId, Base.buildDebitOrCredit(account1Name, '50'), Base.buildDebitOrCredit(account2Name, '50'), pastDate())

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
