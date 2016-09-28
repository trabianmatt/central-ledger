'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Config = require('../../../../src/lib/config')
const Accounts = require('../../../../src/models/accounts')
const Validator = require('../../../../src/api/transfers/validator')
const ValidationError = require('../../../../src/errors/validation-error')
const P = require('bluebird')

var assertValidationError = (promise, assert, message) => {
  promise.then(a => {
    assert.fail()
    assert.end()
  })
  .catch(e => {
    assert.ok(e instanceof ValidationError)
    assert.equal(e.message, message)
    assert.end()
  })
}

Test('transfer validator', (test) => {
  let hostname = 'http://some-hostname'
  let originalHostName
  let sandbox

  test.beforeEach((t) => {
    sandbox = Sinon.sandbox.create()
    // sandbox.stub(Accounts, 'getByName')
    originalHostName = Config.HOSTNAME
    Config.HOSTNAME = hostname
    t.end()
  })

  test.afterEach((t) => {
    sandbox.restore()
    Config.HOSTNAME = originalHostName
    t.end()
  })

  test.test('reject if transfer null', assert => {
    assertValidationError(Validator.validate(), assert, 'Transfer must be provided')
  })

  test.test('reject if transfer.ledger is not hostname', assert => {
    assertValidationError(Validator.validate({ ledger: 'not-host-name' }), assert, 'transfer.ledger is not valid for this ledger')
  })

  test.test('reject if transfer.credits.account does not belong to host name', assert => {
    let transfer = {
      ledger: hostname,
      credits: [
        {
          account: 'http://not-the-host-name/accounts/name'
        }
      ]
    }
    assertValidationError(Validator.validate(transfer), assert, 'transfer.credits[0].account: Invalid URI')
  })

  test.test('reject if any transfer.credits.account does not belong to host name', assert => {
    let transfer = {
      ledger: hostname,
      credits: [
        {
          account: `${hostname}/accounts/name`
        },
        {
          account: 'http://not-the-host-name/accounts/name'
        }
      ]
    }
    assertValidationError(Validator.validate(transfer), assert, 'transfer.credits[1].account: Invalid URI')
  })

  test.test('reject if transfer.debits.account does not belong to host name', assert => {
    let transfer = {
      ledger: hostname,
      debits: [
        {
          account: 'http://not-the-host-name/accounts/name'
        }
      ]
    }
    assertValidationError(Validator.validate(transfer), assert, 'transfer.debits[0].account: Invalid URI')
  })

  test.test('reject any if transfer.debits.account does not belong to host name', assert => {
    let transfer = {
      ledger: hostname,
      debits: [
        {
          account: `${hostname}/accounts/name`
        },
        {
          account: 'http://not-the-host-name/accounts/name'
        }
      ]
    }
    assertValidationError(Validator.validate(transfer), assert, 'transfer.debits[1].account: Invalid URI')
  })

  test.test('reject if transfer.credits.account name does not exist', assert => {
    let accountName = 'account_name'
    sandbox.stub(Accounts, 'getByName').returns(P.resolve(null))
    let transfer = {
      ledger: hostname,
      credits: [
        {
          account: `${hostname}/accounts/${accountName}`
        }
      ]
    }
    assertValidationError(Validator.validate(transfer), assert, 'Account not found')
  })

  test.test('return transfer if all checks pass', assert => {
    let accountName = 'account_name'
    sandbox.stub(Accounts, 'getByName').withArgs(accountName).returns(P.resolve({}))
    let transfer = {
      ledger: hostname,
      credits: [
        {
          account: `${hostname}/accounts/${accountName}`
        }
      ]
    }

    Validator.validate(transfer)
    .then(t => {
      assert.equal(t, transfer)
      assert.end()
    })
  })

  test.end()
})
