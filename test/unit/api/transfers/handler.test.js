'use strict'

const src = '../../../../src'
const Sinon = require('sinon')
const Test = require('tapes')(require('tape'))
const P = require('bluebird')
const Uuid = require('uuid4')
const Validator = require(`${src}/api/transfers/validator`)
const Config = require(`${src}/lib/config`)
const Handler = require(`${src}/api/transfers/handler`)
const Model = require(`${src}/api/transfers/model`)
const Service = require('../../../../src/services/transfer')
const TransfersReadModel = require(`${src}/models/transfers-read-model`)
const AlreadyExistsError = require(`${src}/errors/already-exists-error`)
const NotFoundError = require(`${src}/errors/not-found-error`)
const ValidationError = require(`${src}/errors/validation-error`)
const UnpreparedTransferError = require(`${src}/errors/unprepared-transfer-error`)

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

Test('transfer handler', function (handlerTest) {
  let sandbox
  let originalHostName
  let hostname = 'http://some-host'

  handlerTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Validator, 'validate', a => P.resolve(a))
    sandbox.stub(Model, 'reject')
    sandbox.stub(Model, 'fulfill')
    sandbox.stub(Service, 'rejectExpired')
    originalHostName = Config.HOSTNAME
    Config.HOSTNAME = hostname
    t.end()
  })

  handlerTest.afterEach(t => {
    Config.HOSTNAME = originalHostName
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
      modelStub.returns(P.resolve(transfer))

      let reply = function (response) {
        assert.equal(response.id, transfer.id)
        assert.equal(response.ledger, transfer.ledger)
        assert.deepEqual(response.debits, transfer.debits)
        assert.deepEqual(response.credits, transfer.credits)
        assert.equal(response.execution_condition, transfer.execution_condition)
        assert.equal(response.expires_at, transfer.expires_at)
        assert.equal(response.state, 'prepared')
        return {
          code: function (statusCode) {
            assert.equal(statusCode, 201)
            assert.end()
          }
        }
      }

      Handler.prepareTransfer(createRequest(Uuid(), payload), reply)
    })

    prepareTransferTest.test('return error if transfer not validated', function (assert) {
      let payload = {}
      let errorMessage = 'Error message'
      sandbox.restore()
      let transferId = Uuid()
      sandbox.stub(Validator, 'validate').withArgs(payload, transferId).returns(P.reject(new ValidationError(errorMessage)))

      let expectedResponse = { id: 'UnprocessableEntityError', message: errorMessage }
      let reply = response => {
        assert.deepEqual(response, expectedResponse)
        return {
          code: statusCode => {
            assert.equal(statusCode, 422)
            assert.end()
          }
        }
      }

      Handler.prepareTransfer(createRequest(transferId, payload), reply)
    })

    prepareTransferTest.test('return error if transfer is already prepared', function (assert) {
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

      let error = new AlreadyExistsError()
      sandbox.stub(Model, 'prepare').returns(P.reject(error))

      let expectedResponse = { id: 'UnprocessableEntityError', message: 'The specified entity already exists and may not be modified.' }
      let reply = response => {
        assert.deepEqual(response, expectedResponse)
        return {
          code: statusCode => {
            assert.equal(statusCode, 422)
            assert.end()
          }
        }
      }

      Handler.prepareTransfer(createRequest(Uuid(), payload), reply)
    })

    prepareTransferTest.end()
  })

  handlerTest.test('fulfillTransfer should', function (fulfillTransferTest) {
    fulfillTransferTest.test('return fulfilled transfer', function (assert) {
      let fulfillment = { id: '3a2a1d9e-8640-4d2d-b06c-84f2cd613204', fulfillment: 'cf:0:_v8' }

      Model.fulfill.returns(P.resolve(fulfillment.fulfillment))

      let reply = function (response) {
        assert.equal(response, fulfillment.fulfillment)
        return {
          code: function (statusCode) {
            assert.equal(statusCode, 200)
            return {
              type: function (type) {
                assert.equal(type, 'text/plain')
                assert.end()
              }
            }
          }
        }
      }

      Handler.fulfillTransfer(createRequest(fulfillment.id, fulfillment.fulfillment), reply)
    })

    fulfillTransferTest.test('return error if transfer is not prepared', function (assert) {
      let fulfillment = { id: '3a2a1d9e-8640-4d2d-b06c-84f2cd613204', fulfillment: 'cf:0:_v8' }
      let error = new UnpreparedTransferError()
      Model.fulfill.returns(P.reject(error))

      let expectedResponse = { id: 'UnprocessableEntityError', message: 'The provided entity is syntactically correct, but there is a generic semantic problem with it.' }
      let reply = response => {
        assert.deepEqual(response, expectedResponse)
        return {
          code: statusCode => {
            assert.equal(statusCode, 422)
            assert.end()
          }
        }
      }

      Handler.fulfillTransfer(createRequest(fulfillment.id, fulfillment.fulfillment), reply)
    })

    fulfillTransferTest.test('return error if transfer has no domain events', function (assert) {
      let fulfillment = { id: '3a2a1d9e-8640-4d2d-b06c-84f2cd613204', fulfillment: 'cf:0:_v8' }

      Model.fulfill.returns(P.reject(new NotFoundError()))

      let expectedResponse = { id: 'NotFoundError', message: 'The requested resource could not be found.' }
      let reply = response => {
        assert.deepEqual(response, expectedResponse)
        return {
          code: statusCode => {
            assert.equal(statusCode, 404)
            assert.end()
          }
        }
      }

      Handler.fulfillTransfer(createRequest(fulfillment.id, fulfillment.fulfillment), reply)
    })

    fulfillTransferTest.end()
  })

  handlerTest.test('reject transfer', rejectTransferTest => {
    rejectTransferTest.test('should return 200', assert => {
      let rejectReason = 'error reason'
      let request = {
        params: { id: '3a2a1d9e-8640-4d2d-b06c-84f2cd613204' },
        payload: rejectReason
      }

      Model.reject.returns(P.resolve(rejectReason))
      let reply = function (response) {
        assert.equal(response, rejectReason)
        return {
          code: statusCode => {
            assert.equal(200, statusCode)
            return {
              type: function (type) {
                assert.equal(type, 'text/plain')
                assert.end()
              }
            }
          }
        }
      }
      Handler.rejectTransfer(request, reply)
    })

    rejectTransferTest.test('return error if transfer has no domain events', function (assert) {
      let rejectReason = 'error reason'
      let request = {
        params: { id: '3a2a1d9e-8640-4d2d-b06c-84f2cd613204' },
        payload: rejectReason
      }
      Model.reject.returns(P.reject(new NotFoundError()))

      let expectedResponse = { id: 'NotFoundError', message: 'The requested resource could not be found.' }
      let reply = response => {
        assert.deepEqual(response, expectedResponse)
        return {
          code: statusCode => {
            assert.equal(statusCode, 404)
            assert.end()
          }
        }
      }

      Handler.rejectTransfer(request, reply)
    })

    rejectTransferTest.end()
  })

  handlerTest.test('getTransferById should', function (getTransferByIdTest) {
    getTransferByIdTest.test('get transfer by transfer id', function (assert) {
      let id = Uuid()

      let readModelTransfer = {
        transferUuid: id,
        ledger: hostname,
        debitAccount: 'dfsp1',
        debitAmount: '25',
        creditAccount: 'dfsp2',
        creditAmount: '15',
        creditRejected: 0,
        executionCondition: 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2',
        expiresAt: '2015-06-16T00:00:01.000Z',
        state: 'prepared',
        preparedDate: new Date()
      }
      sandbox.stub(TransfersReadModel, 'getById').returns(P.resolve(readModelTransfer))

      let reply = function (response) {
        assert.equal(response.id, `${hostname}/transfers/${readModelTransfer.transferUuid}`)
        assert.equal(response.ledger, readModelTransfer.ledger)
        assert.equal(response.debits.length, 1)
        assert.equal(response.debits[0].account, readModelTransfer.debitAccount)
        assert.equal(response.debits[0].amount, readModelTransfer.debitAmount)
        assert.equal(response.credits.length, 1)
        assert.equal(response.credits[0].account, readModelTransfer.creditAccount)
        assert.equal(response.credits[0].amount, readModelTransfer.creditAmount)
        assert.notOk(response.credits[0].rejected)
        assert.notOk(response.credits[0].rejection_message)
        assert.equal(response.execution_condition, readModelTransfer.executionCondition)
        assert.equal(response.expires_at, readModelTransfer.expiresAt)
        assert.equal(response.state, readModelTransfer.state)
        assert.ok(response.timeline)
        assert.equal(response.timeline.prepared_at, readModelTransfer.preparedDate)
        return {
          code: function (statusCode) {
            assert.equal(statusCode, 200)
            assert.end()
          }
        }
      }

      Handler.getTransferById(createRequest(id), reply)
    })

    getTransferByIdTest.test('return 404 if transfer null', function (assert) {
      sandbox.stub(TransfersReadModel, 'getById').returns(P.resolve(null))
      let expectedResponse = { id: 'NotFoundError', message: 'The requested resource could not be found.' }
      let reply = response => {
        assert.deepEqual(response, expectedResponse)
        return {
          code: statusCode => {
            assert.equal(statusCode, 404)
            assert.end()
          }
        }
      }

      Handler.getTransferById(createRequest(), reply)
    })

    getTransferByIdTest.test('return error if model throws error', function (assert) {
      let error = new Error()
      sandbox.stub(TransfersReadModel, 'getById').returns(P.reject(error))

      let expectedResponse = { id: 'InternalServerError', message: 'The server encountered an unexpected condition which prevented it from fulfilling the request.' }
      let reply = response => {
        assert.deepEqual(response, expectedResponse)
        return {
          code: statusCode => {
            assert.equal(statusCode, 500)
            assert.end()
          }
        }
      }

      Handler.getTransferById(createRequest(), reply)
    })

    getTransferByIdTest.end()
  })

  handlerTest.test('getTransferFulfillment should', function (getTransferFulfillmentTest) {
    getTransferFulfillmentTest.test('get fulfillment by transfer id', function (assert) {
      let id = Uuid()

      let transfer = { transferUuid: id, fulfillment: 'cf:0:_v8', state: 'executed' }
      sandbox.stub(TransfersReadModel, 'getById').returns(P.resolve(transfer))

      let reply = function (response) {
        assert.equal(response, transfer.fulfillment)
        return {
          code: function (statusCode) {
            assert.equal(statusCode, 200)
            return {
              type: function (type) {
                assert.equal(type, 'text/plain')
                assert.end()
              }
            }
          }
        }
      }

      Handler.getTransferFulfillment(createRequest(id), reply)
    })

    getTransferFulfillmentTest.test('return 404 if transfer not executed', function (assert) {
      let id = Uuid()

      let transfer = { transferUuid: id, fulfillment: 'cf:0:_v8', state: 'prepared' }
      sandbox.stub(TransfersReadModel, 'getById').returns(P.resolve(transfer))

      let expectedResponse = { id: 'NotFoundError', message: 'The requested resource could not be found.' }
      let reply = response => {
        assert.deepEqual(response, expectedResponse)
        return {
          code: statusCode => {
            assert.equal(statusCode, 404)
            assert.end()
          }
        }
      }

      Handler.getTransferFulfillment(createRequest(), reply)
    })

    getTransferFulfillmentTest.test('return 404 if transfer null', function (assert) {
      sandbox.stub(TransfersReadModel, 'getById').returns(P.resolve(null))

      let expectedResponse = { id: 'NotFoundError', message: 'The requested resource could not be found.' }
      let reply = response => {
        assert.deepEqual(response, expectedResponse)
        return {
          code: statusCode => {
            assert.equal(statusCode, 404)
            assert.end()
          }
        }
      }

      Handler.getTransferFulfillment(createRequest(), reply)
    })

    getTransferFulfillmentTest.test('return error if model throws error', function (assert) {
      let error = new Error()
      sandbox.stub(TransfersReadModel, 'getById').returns(P.reject(error))

      let expectedResponse = { id: 'InternalServerError', message: 'The server encountered an unexpected condition which prevented it from fulfilling the request.' }
      let reply = response => {
        assert.deepEqual(response, expectedResponse)
        return {
          code: statusCode => {
            assert.equal(statusCode, 500)
            assert.end()
          }
        }
      }

      Handler.getTransferFulfillment(createRequest(), reply)
    })

    getTransferFulfillmentTest.end()
  })

  handlerTest.end()
})
