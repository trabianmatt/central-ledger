'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Base = require('../../base')
const Config = require('../../../../src/lib/config')
const Accounts = require('../../../../src/domain/account')

const toAccount = 'http://central-ledger/accounts/to'
const fromAccount = 'http://central-ledger/accounts/from'

const createPayload = ({ledger = Config.HOSTNAME, from = fromAccount, to = toAccount, data = {}}) => {
  return {
    ledger,
    from,
    to,
    data
  }
}

const buildRequest = (payload = {}) => {
  return Base.buildRequest({ url: '/messages', method: 'POST', payload })
}

Test('POST /messages', postTest => {
  let fixtures
  let sandbox

  postTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Accounts, 'exists')
    Accounts.exists.returns(P.resolve({}))
    fixtures = Base.setup()
    test.end()
  })

  postTest.afterEach(test => {
    sandbox.restore()
    test.end()
  })

  postTest.test('return error if required fields are missing', test => {
    let req = buildRequest({})

    fixtures.server.inject(req, res => {
      Base.assertBadRequestError(test, res, [
        { message: 'ledger is required', params: { key: 'ledger' } },
        { message: 'from is required', params: { key: 'from' } },
        { message: 'to is required', params: { key: 'to' } },
        { message: 'data is required', params: { key: 'data' } }
      ])
      test.end()
    })
  })

  postTest.test('return error if ledger is not url', test => {
    let req = buildRequest(createPayload({ ledger: 'test' }))

    fixtures.server.inject(req, res => {
      Base.assertBadRequestError(test, res, [{ message: 'ledger must be a valid uri', params: { key: 'ledger', value: 'test' } }])
      test.end()
    })
  })

  postTest.test('return error if ledger is not valid', test => {
    let req = buildRequest(createPayload({ ledger: 'http://not-valid' }))
    fixtures.server.inject(req, res => {
      Base.assertBadRequestError(test, res, [{ message: 'ledger is not valid for this ledger', params: { key: 'ledger', value: 'http://not-valid' } }])
      test.end()
    })
  })

  postTest.end()
})
