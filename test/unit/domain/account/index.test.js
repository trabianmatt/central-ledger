'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Uuid = require('uuid4')
const Model = require('../../../../src/domain/account/model')
const Crypto = require('../../../../src/lib/crypto')
const ValidationError = require('../../../../src/errors/validation-error')
const AccountService = require('../../../../src/domain/account')

Test('Account service', serviceTest => {
  let sandbox

  serviceTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Model)
    sandbox.stub(Crypto)
    test.end()
  })

  serviceTest.afterEach(test => {
    sandbox.restore()
    test.end()
  })

  serviceTest.test('create should', createTest => {
    createTest.test('add username and hashed password to account in model', test => {
      const name = 'dfsp1'
      const accountId = Uuid()
      const createdDate = new Date()
      const password = 'password'
      const hashedPassword = 'hashed password'
      Model.create.returns(P.resolve({ name, accountId, createdDate }))
      Crypto.hash.withArgs(password).returns(P.resolve(hashedPassword))
      AccountService.create({ name, password })
      .then(account => {
        test.equal(account.accountId, accountId)
        test.equal(account.name, name)
        test.equal(account.createdDate, createdDate)
        const createArgs = Model.create.firstCall.args
        test.equal(createArgs[0].hashedPassword, hashedPassword)
        test.end()
      })
    })

    createTest.end()
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

  serviceTest.test('getAll should', getAllTest => {
    getAllTest.test('getAll from Model', test => {
      const all = []
      Model.getAll.returns(P.resolve(all))
      AccountService.getAll()
      .then(result => {
        test.equal(result, all)
        test.end()
      })
    })

    getAllTest.end()
  })

  serviceTest.test('getById should', getByIdTest => {
    getByIdTest.test('getById from Model', test => {
      const account = {}
      const id = '12345'
      Model.getById.withArgs(id).returns(P.resolve(account))
      AccountService.getById(id)
      .then(result => {
        test.equal(result, account)
        test.end()
      })
    })

    getByIdTest.end()
  })

  serviceTest.test('getByName should', getByNameTest => {
    getByNameTest.test('getByName from Model', test => {
      const account = {}
      const name = '12345'
      Model.getByName.withArgs(name).returns(P.resolve(account))
      AccountService.getByName(name)
      .then(result => {
        test.equal(result, account)
        test.end()
      })
    })

    getByNameTest.end()
  })

  serviceTest.test('update should', updateTest => {
    updateTest.test('update from Model', test => {
      const isDisabled = false
      const name = '12345'
      const id = 1
      const account = {
        accountId: id,
        isDisabled: true
      }
      const updatedAccount = {
        accountId: id,
        isDisabled: isDisabled
      }
      const payload = {
        name: name,
        is_disabled: isDisabled
      }
      Model.getByName.withArgs(name).returns(P.resolve(account))
      Model.update.withArgs(account, isDisabled).returns(P.resolve(updatedAccount))
      AccountService.update(name, payload)
      .then(result => {
        test.equal(result.accountId, account.accountId)
        test.equal(result.isDisabled, isDisabled)
        test.end()
      })
    })

    updateTest.end()
  })

  serviceTest.test('verify should', verifyTest => {
    verifyTest.test('return false if account not found', test => {
      Model.getByName.returns(P.resolve(null))
      AccountService.verify('name', 'password')
        .catch(result => {
          test.equal(result.message, 'Account does not exist')
          test.end()
        })
    })

    verifyTest.test('return error if passwords do not match', test => {
      const accountId = '1234'
      const name = 'name'
      const password = 'password'
      const account = { name, accountId }
      const userCredentials = { accountId, password }
      Model.getByName.withArgs(name).returns(P.resolve(account))
      Model.retrieveUserCredentials.returns(P.resolve(userCredentials))
      Crypto.verifyHash.withArgs(password, userCredentials.password).returns(P.resolve(false))

      AccountService.verify(name, password)
        .catch(result => {
          test.equal(result.message, 'Username and password are invalid')
          test.end()
        })
    })

    verifyTest.test('return account if passwords match', test => {
      const accountId = '1234'
      const name = 'name'
      const password = 'password'
      const account = { name, accountId }
      const userCredentials = { accountId, password }
      Model.getByName.withArgs(name).returns(P.resolve(account))
      Model.retrieveUserCredentials.returns(P.resolve(userCredentials))
      Crypto.verifyHash.withArgs(password, userCredentials.password).returns(P.resolve(true))

      AccountService.verify(name, password)
        .then(result => {
          test.equal(result, account)
          test.end()
        })
    })

    verifyTest.end()
  })

  serviceTest.end()
})
