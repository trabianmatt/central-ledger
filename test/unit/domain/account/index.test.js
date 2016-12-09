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
    createTest.test('add key and hashed secret to account in model', test => {
      const name = 'dfsp1'
      const accountId = Uuid()
      const createdDate = new Date()
      const key = 'key'
      const secret = 'secret'
      const hashedSecret = 'hashed secret'
      Model.create.returns(P.resolve({ name, accountId, createdDate }))
      Crypto.generateKey.returns(P.resolve(key))
      Crypto.generateSecret.returns(P.resolve(secret))
      Crypto.hash.withArgs(secret).returns(P.resolve(hashedSecret))
      AccountService.create({ name })
      .then(account => {
        test.equal(account.accountId, accountId)
        test.equal(account.name, name)
        test.equal(account.createdDate, createdDate)
        test.equal(account.credentials.key, key)
        test.equal(account.credentials.secret, secret)
        const createArgs = Model.create.firstCall.args
        test.equal(createArgs[0].name, name)
        test.equal(createArgs[0].key, key)
        test.equal(createArgs[0].secret, hashedSecret)
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

  serviceTest.test('getByKey should', getByKeyTest => {
    getByKeyTest.test('getByKey from Model', test => {
      const account = {}
      const key = '12345'
      Model.getByKey.withArgs(key).returns(P.resolve(account))
      AccountService.getByKey(key)
      .then(result => {
        test.equal(result, account)
        test.end()
      })
    })

    getByKeyTest.end()
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

  serviceTest.test('verify should', verifyTest => {
    verifyTest.test('return false if account not found', test => {
      Model.getByKey.returns(P.resolve(null))
      AccountService.verify('key', 'secret')
        .catch(result => {
          test.equal(result.message, 'Account does not exist')
          test.end()
        })
    })

    verifyTest.test('return false if account secret and secret are not match', test => {
      const key = 'key'
      const secret = 'secret'
      const password = 'password'
      Model.getByKey.withArgs(key).returns(P.resolve({ key, secret }))
      Crypto.verifyHash.withArgs(secret, password).returns(P.resolve(false))
      AccountService.verify(key, password)
        .catch(result => {
          test.equal(result.message, 'Secret is not valid for account')
          test.end()
        })
    })

    verifyTest.test('return account if account secret and secret match', test => {
      const key = 'key'
      const secret = 'secret'
      const account = { key, secret }
      Model.getByKey.withArgs(key).returns(P.resolve(account))
      const password = 'password'
      Crypto.verifyHash.withArgs(secret, password).returns(P.resolve(true))
      AccountService.verify(key, password)
        .then(result => {
          test.equal(result, account)
          test.end()
        })
    })

    verifyTest.end()
  })

  serviceTest.end()
})
