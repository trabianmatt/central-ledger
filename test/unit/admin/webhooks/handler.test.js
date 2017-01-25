'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Uuid = require('uuid4')
const P = require('bluebird')
const TransferService = require('../../../../src/services/transfer')
const TokenService = require('../../../../src/domain/token')
const Handler = require('../../../../src/admin/webhooks/handler')

function createRequest (id, payload) {
  let requestId = id || Uuid()
  let requestPayload = payload || {}
  return {
    payload: requestPayload,
    params: { id: requestId },
    server: {
      log: function () { }
    }
  }
}

Test('Handler Test', handlerTest => {
  let sandbox

  handlerTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(TransferService, 'rejectExpired')
    sandbox.stub(TransferService, 'settle')
    sandbox.stub(TokenService, 'removeExpired')
    t.end()
  })

  handlerTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  handlerTest.test('rejectExpired should', rejectExpiredTest => {
    rejectExpiredTest.test('return rejected transfer ids', test => {
      let transferIds = [Uuid(), Uuid(), Uuid()]
      TransferService.rejectExpired.returns(P.resolve(transferIds))

      let reply = response => {
        test.equal(response, transferIds)
        test.end()
      }

      Handler.rejectExpired({}, reply)
    })

    rejectExpiredTest.test('return error if rejectExpired fails', test => {
      let error = new Error()
      TransferService.rejectExpired.returns(P.reject(error))

      let reply = response => {
        test.equal(response, error)
        test.end()
      }

      Handler.rejectExpired(createRequest(), reply)
    })

    rejectExpiredTest.end()
  })

  handlerTest.test('settle should', settleTest => {
    settleTest.test('return settled transfer ids', test => {
      let transferIds = [Uuid(), Uuid(), Uuid()]
      TransferService.settle.returns(P.resolve(transferIds))

      let reply = response => {
        test.equal(response, transferIds)
        test.end()
      }

      Handler.settle({}, reply)
    })

    settleTest.test('return error if settlement failed', test => {
      let error = new Error()
      TransferService.settle.returns(P.reject(error))

      let reply = response => {
        test.equal(response, error)
        test.end()
      }

      Handler.settle(createRequest(), reply)
    })

    settleTest.end()
  })

  handlerTest.test('removeExpired should', removeExpiredTest => {
    removeExpiredTest.test('return expired tokens', test => {
      let tokenIds = [Uuid(), Uuid(), Uuid()]
      TokenService.removeExpired.returns(P.resolve(tokenIds))

      let reply = response => {
        test.equal(response, tokenIds)
        test.end()
      }

      Handler.rejectExpiredTokens({}, reply)
    })

    removeExpiredTest.test('return error if removeExpired fails', test => {
      let error = new Error()
      TokenService.removeExpired.returns(P.reject(error))

      let reply = response => {
        test.equal(response, error)
        test.end()
      }

      Handler.rejectExpiredTokens(createRequest(), reply)
    })

    removeExpiredTest.end()
  })

  handlerTest.end()
})
