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
          assert.equal(1000000.00, getRes.body.balance)
          assert.equal(false, getRes.body.is_disabled)
          assert.equal('http://central-ledger', getRes.body.ledger)
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
