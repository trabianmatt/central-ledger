'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Model = require('../../../../src/models/accounts')
const ValidationError = require('../../../../src/errors/validation-error')
const AccountService = require('../../../../src/domain/account')

Test('Account service', serviceTest => {
  let sandbox

  serviceTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Model, 'getByName')
    test.end()
  })

  serviceTest.afterEach(test => {
    sandbox.restore()
    test.end()
  })

  serviceTest.test('exists should', existsTest => {
    existsTest.test('reject if url is not parseable url', test => {
      AccountService.exists('not a url')
      .catch(ValidationError, e => {
        test.equal(e.message, 'Invalid account URI: not a url')
        test.end()
      })
    })

    existsTest.test('reject if account does not exist', test => {
      Model.getByName.returns(P.resolve(null))
      AccountService.exists('http://central-ledger/accounts/dfsp1')
      .catch(ValidationError, e => {
        test.equal(e.message, 'Account dfsp1 not found')
        test.end()
      })
    })

    existsTest.test('return error if exists', test => {
      const account = { some_field: 1234 }
      Model.getByName.withArgs('dfsp2').returns(P.resolve(account))
      AccountService.exists('http://central-ledger/accounts/dfsp2')
      .then(result => {
        test.equal(result, account)
        test.end()
      })
    })

    existsTest.end()
  })
  serviceTest.end()
})
