'use strict'

const Test = require('tape')
const Base = require('../../base')
const Fixtures = require('../../../fixtures')

Test('post and get an account', function (assert) {
  let accountName = Fixtures.generateAccountName()

  Base.createAccount(accountName)
    .expect(201)
    .expect('Content-Type', /json/)
    .then(res => {
      let expectedCreated = res.body.created
      assert.notEqual(expectedCreated, undefined)
      assert.equal(res.body.name, accountName)

      Base.getAccount(accountName)
        .expect(200)
        .expect('Content-Type', /json/)
        .then(getRes => {
          assert.equal(accountName, getRes.body.name)
          assert.equal(expectedCreated, getRes.body.created)
          assert.equal('0', getRes.body.balance)
          assert.equal(false, getRes.body.is_disabled)
          assert.equal('http://central-ledger', getRes.body.ledger)
          assert.end()
        })
    })
})

Test('return the net position for the account as the balance', function (assert) {
  let fulfillment = 'cf:0:_v8'
  let account1Name = Fixtures.generateAccountName()
  let account2Name = Fixtures.generateAccountName()

  let transferId = Fixtures.generateTransferId()
  let transfer = Fixtures.buildTransfer(transferId, Fixtures.buildDebitOrCredit(account1Name, '50'), Fixtures.buildDebitOrCredit(account2Name, '50'))

  let transfer2Id = Fixtures.generateTransferId()
  let transfer2 = Fixtures.buildTransfer(transfer2Id, Fixtures.buildDebitOrCredit(account2Name, '15'), Fixtures.buildDebitOrCredit(account1Name, '15'))

  Base.createAccount(account1Name)
    .then(() => Base.createAccount(account2Name))
    .then(() => Base.prepareTransfer(transferId, transfer))
    .delay(100)
    .then(() => Base.fulfillTransfer(transferId, fulfillment))
    .then(() => Base.prepareTransfer(transfer2Id, transfer2))
    .delay(100)
    .then(() => Base.fulfillTransfer(transfer2Id, fulfillment))
    .delay(100)
    .then(() => {
      Base.getAccount(account1Name)
        .expect(200)
        .expect('Content-Type', /json/)
        .then(res => {
          assert.equal(account1Name, res.body.name)
          assert.equal('-35', res.body.balance)
          assert.end()
        })
    })
})

Test('ensure an account name can only be registered once', function (assert) {
  let accountName = Fixtures.generateAccountName()

  Base.createAccount(accountName)
    .expect(201)
    .expect('Content-Type', /json/)
    .then(() => {
      Base.createAccount(accountName)
        .expect(422)
        .expect('Content-Type', /json/)
        .then(res => {
          assert.equal(res.body.id, 'UnprocessableEntityError')
          assert.equal(res.body.message, 'The account has already been registered')
          assert.end()
        })
    })
})
