'use strict'

const Sinon = require('sinon')
const Test = require('tapes')(require('tape'))
const Boom = require('boom')
const Validator = require('../../../../src/api/transfers/validator')
const ValidationError = require('../../../../src/errors/validation-error')
const P = require('bluebird')
const Handler = require('../../../../src/api/transfers/handler')
const Model = require('../../../../src/api/transfers/model')

function createRequest (payload) {
  return {
    payload: payload || {},
    server: {
      log: function () { }
    }
  }
}

Test('transfer handler', function (handlerTest) {
  let sandbox

  handlerTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Validator, 'validate', a => P.resolve(a))
    t.end()
  })

  handlerTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  handlerTest.test('prepareTransfer should', function (prepareTransferTest) {
    prepareTransferTest.test('return prepared transfer', function (assert) {
      let payload = {
        id: 'https://central-ledger/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204',
        ledger: 'http://usd-ledger.example/USD',
        debits: [
          {
            account: 'http://usd-ledger.example/USD/accounts/alice',
            amount: '50'
          }
        ],
        credits: [
          {
            account: 'http://usd-ledger.example/USD/accounts/bob',
            amount: '50'
          }
        ],
        execution_condition: 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2',
        expires_at: '2015-06-16T00:00:01.000Z'
      }
      let transfer = {
        id: payload.id,
        ledger: payload.ledger,
        debits: payload.debits,
        credits: payload.credits,
        execution_condition: payload.execution_condition,
        expires_at: payload.expires_at
      }
      let modelStub = sandbox.stub(Model, 'prepare')
      modelStub.returns(Promise.resolve(transfer))

      let reply = function (response) {
        assert.equal(response.id, transfer.id)
        assert.equal(response.ledger, transfer.ledger)
        assert.deepEqual(response.debits, transfer.debits)
        assert.deepEqual(response.credits, transfer.credits)
        assert.equal(response.execution_condition, transfer.execution_condition)
        assert.equal(response.expires_at, transfer.expires_at)
        return {
          code: function (statusCode) {
            assert.equal(statusCode, 201)
            assert.end()
          }
        }
      }

      Handler.prepareTransfer(createRequest(payload), reply)
    })

    prepareTransferTest.test('return error if transfer not validated', function (assert) {
      let payload = {}
      let errorMessage = 'Error message'
      sandbox.restore()
      sandbox.stub(Validator, 'validate').returns(P.reject(new ValidationError(errorMessage)))

      let reply = response => {
        let boomError = Boom.badData(errorMessage)
        assert.deepEqual(response, boomError)
        assert.end()
      }

      Handler.prepareTransfer(createRequest(payload), reply)
    })

    prepareTransferTest.test('return error if transfer is already created', function (assert) {
      let payload = {
        id: 'https://central-ledger/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204',
        ledger: 'http://usd-ledger.example/USD',
        debits: [
          {
            account: 'http://usd-ledger.example/USD/accounts/alice',
            amount: '50'
          }
        ],
        credits: [
          {
            account: 'http://usd-ledger.example/USD/accounts/bob',
            amount: '50'
          }
        ],
        execution_condition: 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2',
        expires_at: '2015-06-16T00:00:01.000Z'
      }
      let error = new Error('')
      error.originalErrorMessage = 'aggregate with id=3a2a1d9e-8640-4d2d-b06c-84f2cd613204 already created'
      sandbox.stub(Model, 'prepare').returns(Promise.reject(error))

      let reply = function (response) {
        let boomError = Boom.badData("Can't re-prepare an existing transfer.")
        assert.deepEqual(response, boomError)
        assert.end()
      }

      Handler.prepareTransfer(createRequest(payload), reply)
    })

    prepareTransferTest.end()
  })

  handlerTest.test('fulfillTransfer should', function (fulfillTransferTest) {
    fulfillTransferTest.test('return fulfilled transfer', function (assert) {
      let fulfillment = { id: '3a2a1d9e-8640-4d2d-b06c-84f2cd613204', fulfillment: 'cf:0:_v8' }
      sandbox.stub(Model, 'fulfill').returns(Promise.resolve(fulfillment.fulfillment))

      let reply = function (response) {
        assert.equal(response, fulfillment.fulfillment)
        return {
          code: function (statusCode) {
            assert.equal(statusCode, 200)
            assert.end()
          }
        }
      }

      let request = {
        payload: fulfillment.fulfillment,
        params: { id: fulfillment.id }
      }
      Handler.fulfillTransfer(request, reply)
    })

    fulfillTransferTest.test('return error if transfer is not prepared', function (assert) {
      let fulfillment = { id: '3a2a1d9e-8640-4d2d-b06c-84f2cd613204', fulfillment: 'cf:0:_v8' }
      let error = new Error('')
      error.originalErrorMessage = 'transfer exists, but is not prepared'
      sandbox.stub(Model, 'fulfill').returns(Promise.reject(error))

      let reply = function (response) {
        let boomError = Boom.badData("Can't execute a non-prepared transfer.")
        assert.deepEqual(response, boomError)
        assert.end()
      }

      let request = {
        payload: fulfillment.fulfillment,
        params: { id: fulfillment.id }
      }
      Handler.fulfillTransfer(request, reply)
    })

    fulfillTransferTest.test('return error if transfer has no domain events', function (assert) {
      let fulfillment = { id: '3a2a1d9e-8640-4d2d-b06c-84f2cd613204', fulfillment: 'cf:0:_v8' }
      let error = new Error('')
      error.originalErrorMessage = 'No domainEvents for aggregate of type Transfer'
      sandbox.stub(Model, 'fulfill').returns(Promise.reject(error))

      let reply = function (response) {
        let boomError = Boom.notFound()
        assert.deepEqual(response, boomError)
        assert.end()
      }

      let request = {
        payload: fulfillment.fulfillment,
        params: { id: fulfillment.id }
      }

      Handler.fulfillTransfer(request, reply)
    })

    fulfillTransferTest.end()
  })

  handlerTest.test('reject transfer', rejectTransferTest => {
    rejectTransferTest.test('should return 200', assert => {
      let payload = 'error reason'
      let request = {
        params: { id: '3a2a1d9e-8640-4d2d-b06c-84f2cd613204' },
        payload: payload
      }
      let reply = function (response) {
        assert.equal(response, payload)
        return {
          code: statusCode => {
            assert.equal(200, statusCode)
            assert.end()
          }
        }
      }
      Handler.rejectTransfer(request, reply)
    })

    rejectTransferTest.end()
  })

  handlerTest.end()
})
