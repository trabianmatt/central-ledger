'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Uuid = require('uuid4')
const Config = require('../../../../src/lib/config')
const UrlParser = require('../../../../src/lib/urlparser')
const Accounts = require('../../../../src/models/accounts')
const Validator = require('../../../../src/api/transfers/validator')
const ValidationError = require('../../../../src/errors/validation-error')
const P = require('bluebird')

let assertValidationError = (promise, assert, message) => {
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
  const hostname = 'http://some-hostname'
  const badAccountUri = 'bad_account_uri'
  let transferId
  let originalHostName
  let sandbox

  let goodTransfer = function () {
    transferId = Uuid()
    const accountName = 'some_account_name'
    const transferIdUri = `${hostname}/transfers/${transferId}`
    let accountUri = `${hostname}/accounts/${accountName}`
    Accounts.getByName.withArgs(accountName).returns(P.resolve({}))
    UrlParser.nameFromAccountUri.withArgs(badAccountUri).returns(null)
    UrlParser.nameFromAccountUri.withArgs(accountUri).returns(accountName)
    UrlParser.idFromTransferUri.withArgs(transferIdUri).returns(transferId)
    return {
      id: transferIdUri,
      ledger: hostname,
      credits: [
        {
          account: accountUri
        }
      ],
      debits: [
        {
          account: accountUri
        }
      ]
    }
  }

  test.beforeEach((t) => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(UrlParser, 'nameFromAccountUri')
    sandbox.stub(UrlParser, 'idFromTransferUri')
    sandbox.stub(Accounts, 'getByName')
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
    assertValidationError(Validator.validate(null, transferId), assert, 'Transfer must be provided')
  })

  test.test('reject if transfer.ledger is not hostname', assert => {
    let transfer = goodTransfer()
    transfer.ledger = 'not-host-name'
    assertValidationError(Validator.validate(transfer, transferId), assert, 'transfer.ledger is not valid for this ledger')
  })

  test.test('reject if transfer.credits.account is not parseable', assert => {
    let transfer = goodTransfer()
    transfer.credits[0].account = badAccountUri
    assertValidationError(Validator.validate(transfer, transferId), assert, 'transfer.credits[0].account: Invalid URI')
  })

  test.test('reject if transfer.debits.account is not parseable', assert => {
    let transfer = goodTransfer()
    transfer.debits[0].account = badAccountUri
    assertValidationError(Validator.validate(transfer, transferId), assert, 'transfer.debits[0].account: Invalid URI')
  })

  test.test('reject if transfer.credits.account name does not exist', assert => {
    let badAccountName = 'bad_account_name'
    let accountUri = 'some-debit-account'
    let transfer = goodTransfer()
    transfer.credits[0].account = accountUri
    UrlParser.nameFromAccountUri.withArgs(accountUri).returns(badAccountName)
    Accounts.getByName.withArgs(badAccountName).returns(P.resolve(null))
    assertValidationError(Validator.validate(transfer, transferId), assert, 'Account not found')
  })

  test.test('reject if transfer.debits.account name does not exist', assert => {
    let badAccountName = 'bad_account_name'
    let accountUri = 'some-debit-account'
    let transfer = goodTransfer()
    transfer.debits[0].account = accountUri
    UrlParser.nameFromAccountUri.withArgs(accountUri).returns(badAccountName)
    Accounts.getByName.withArgs(badAccountName).returns(P.resolve(null))
    assertValidationError(Validator.validate(transfer, transferId), assert, 'Account not found')
  })

  test.test('reject if transfer.id is not url', assert => {
    let transfer = goodTransfer()
    transfer.id = 'jfksjfskaljfsljflkasjflsa'
    UrlParser.idFromTransferUri.withArgs(transfer.id).returns(null)
    assertValidationError(Validator.validate(transfer, transferId), assert, 'transfer.id: Invalid URI')
  })

  test.test('reject if transfer.id uuid does not match provided transferId', assert => {
    let transfer = goodTransfer()
    assertValidationError(Validator.validate(transfer, Uuid()), assert, 'transfer.id: Invalid URI')
  })

  test.test('return transfer if all checks pass', assert => {
    let transfer = goodTransfer()
    Validator.validate(transfer, transferId)
    .then(t => {
      assert.equal(t, transfer)
      assert.end()
    })
  })

  test.end()
})
