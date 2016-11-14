'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Uuid = require('uuid4')
const P = require('bluebird')
const Service = require('../../../../src/services/transfer')
const Handler = require('../../../../src/webhooks/commands/handler')

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
    sandbox.stub(Service, 'rejectExpired')
    t.end()
  })

  handlerTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  handlerTest.test('rejectExpired should', rejectExpiredTest => {
    rejectExpiredTest.test('return rejected transfer ids', test => {
      let transferIds = [Uuid(), Uuid(), Uuid()]
      Service.rejectExpired.returns(P.resolve(transferIds))

      let reply = response => {
        test.equal(response, transferIds)
        test.end()
      }

      Handler.rejectExpired({}, reply)
    })

    rejectExpiredTest.test('return error if rejectExpired fails', test => {
      let error = new Error()
      Service.rejectExpired.returns(P.reject(error))

      let reply = response => {
        test.equal(response, error)
        test.end()
      }

      Handler.rejectExpired(createRequest(), reply)
    })

    rejectExpiredTest.end()
  })

  handlerTest.end()
})
