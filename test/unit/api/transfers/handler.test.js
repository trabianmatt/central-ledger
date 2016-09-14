'use strict'

const Proxyquire = require('proxyquire')
const Sinon = require('sinon')
const Test = require('tape')
const Boom = require('boom')

function createHandler (model) {
  return Proxyquire('../../../../src/api/transfers/handler', {
    './model': model
  })
}

function createRequest (payload) {
  let requestPayload = payload || {}
  return {
    payload: requestPayload,
    server: {
      log: function () { }
    }
  }
}

Test('transfer handler', function (handlerTest) {
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
      let model = {
        prepare: Sinon.stub().withArgs(payload).returns(Promise.resolve(transfer))
      }

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

      createHandler(model).prepareTransfer(createRequest(payload), reply)
    })

    prepareTransferTest.test('return error if model throws error on transfer creation', function (assert) {
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
        expires_at: '2015-06-16T00:00:01.000Z',
        amount: '11.11'
      }
      let error = new Error()
      let model = {
        prepare: function (data) { return Promise.reject(error) }
      }

      let reply = function (response) {
        let boomError = Boom.wrap(error)
        assert.deepEqual(response, boomError)
        assert.end()
      }

      createHandler(model).prepareTransfer(createRequest(payload), reply)
    })

    prepareTransferTest.end()
  })

  handlerTest.test('fulfillTransfer should', function (fulfillTransferTest) {
    fulfillTransferTest.test('return fulfilled transfer', function (t) {
      let payload = 'cf:0:_v8'
      let executionConditionFufillment = payload
      let model = {
        fulfill: Sinon.stub().returns(Promise.resolve(executionConditionFufillment))
      }

      let reply = function (response) {
        t.equal(response, executionConditionFufillment)
        return {
          code: function (statusCode) {
            t.equal(statusCode, 200)
            t.end()
          }
        }
      }
      createHandler(model).fulfillTransfer(createRequest(payload), reply)
    })

    fulfillTransferTest.end()
  })

  handlerTest.end()
})
