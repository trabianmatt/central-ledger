'use strict'

const Test = require('tape')
const Base = require('../../base')

Test('GET /transfers/:id', getTest => {
  getTest.test('should return transfer details', function (assert) {
    let account1Name = Base.generateAccountName()
    let account2Name = Base.generateAccountName()
    let transferId = Base.generateTransferId()
    let transfer = Base.buildTransfer(transferId, Base.buildDebitOrCredit(account1Name, '50'), Base.buildDebitOrCredit(account2Name, '50'))

    Base.createAccount(account1Name)
    .then(() => Base.createAccount(account2Name))
    .then(() => Base.prepareTransfer(transferId, transfer))
    .then(() => {
      Base.get(`/transfers/${transferId}`)
        .expect(200, function (err, res) {
          if (err) return assert.end(err)
          assert.equal(res.body.id, transfer.id)
          assert.equal(res.body.ledger, transfer.ledger)
          assert.equal(res.body.debits[0].account, transfer.debits[0].account)
          assert.equal(res.body.debits[0].amount, parseInt(transfer.debits[0].amount).toFixed(2).toString())
          assert.equal(res.body.credits[0].account, transfer.credits[0].account)
          assert.equal(res.body.credits[0].amount, parseInt(transfer.credits[0].amount).toFixed(2).toString())
          assert.equal(res.body.execution_condition, transfer.execution_condition)
          assert.equal(res.body.expires_at, transfer.expires_at)
          assert.equal(res.body.state, 'prepared')
          assert.ok(res.body.timeline.prepared_at)
          assert.notOk(res.body.timeline.executed_at)
          assert.end()
        })
        .expect('Content-Type', /json/)
    })
  })

  getTest.end()
})
