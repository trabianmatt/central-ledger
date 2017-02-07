'use strict'

const src = '../../../../src'
const Sinon = require('sinon')
const Test = require('tapes')(require('tape'))
const P = require('bluebird')
const Uuid = require('uuid4')
const NotFoundError = require('@leveloneproject/central-services-shared').NotFoundError
const Validator = require(`${src}/api/transfers/validator`)
const Config = require(`${src}/lib/config`)
const Handler = require(`${src}/api/transfers/handler`)
const TransferService = require(`${src}/domain/transfer`)
const TransferState = require(`${src}/domain/transfer/state`)
const AlreadyExistsError = require(`${src}/errors/already-exists-error`)
const ValidationError = require(`${src}/errors/validation-error`)
const UnpreparedTransferError = require(`${src}/errors/unprepared-transfer-error`)
const executionCondition = 'ni:///sha-256;47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU?fpt=preimage-sha-256&cost=0'

const createRequest = (id, payload) => {
  const requestId = id || Uuid()
  const requestPayload = payload || {}
  return {
    payload: requestPayload,
    params: { id: requestId },
    server: {
      log: () => { }
    }
  }
}

Test('transfer handler', handlerTest => {
  let sandbox
  let originalHostName
  const hostname = 'http://some-host'

  handlerTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Validator, 'validate', a => P.resolve(a))
    sandbox.stub(TransferService, 'prepare')
    sandbox.stub(TransferService, 'getById')
    sandbox.stub(TransferService, 'reject')
    sandbox.stub(TransferService, 'fulfill')
    originalHostName = Config.HOSTNAME
    Config.HOSTNAME = hostname
    t.end()
  })

  handlerTest.afterEach(t => {
    Config.HOSTNAME = originalHostName
    sandbox.restore()
    t.end()
  })

  handlerTest.test('prepareTransfer should', prepareTransferTest => {
    prepareTransferTest.test('reply with status code 200 if transfer exists', test => {
      const payload = {
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
        execution_condition: executionCondition,
        expires_at: '2015-06-16T00:00:01.000Z'
      }

      const transfer = {
        id: payload.id,
        ledger: payload.ledger,
        debits: payload.debits,
        credits: payload.credits,
        execution_condition: payload.execution_condition,
        expires_at: payload.expires_at,
        timeline: {}
      }

      TransferService.prepare.returns(P.resolve({ transfer, existing: true }))

      const reply = response => {
        test.equal(response.id, transfer.id)
        return {
          code: statusCode => {
            test.equal(statusCode, 200)
            test.end()
          }
        }
      }

      Handler.prepareTransfer(createRequest(Uuid(), payload), reply)
    })

    prepareTransferTest.test('reply with status code 201 if transfer does not exist', test => {
      const payload = {
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
        execution_condition: executionCondition,
        expires_at: '2015-06-16T00:00:01.000Z'
      }

      const transfer = {
        id: payload.id,
        ledger: payload.ledger,
        debits: payload.debits,
        credits: payload.credits,
        execution_condition: payload.execution_condition,
        expires_at: payload.expires_at,
        timeline: {}
      }

      TransferService.prepare.returns(P.resolve({ transfer, existing: false }))

      const reply = response => {
        test.equal(response.id, transfer.id)
        return {
          code: statusCode => {
            test.equal(statusCode, 201)
            test.end()
          }
        }
      }

      Handler.prepareTransfer(createRequest(Uuid(), payload), reply)
    })

    prepareTransferTest.test('return error if transfer not validated', test => {
      const payload = {}
      const errorMessage = 'Error message'
      sandbox.restore()
      const transferId = Uuid()
      const error = new ValidationError(errorMessage)
      sandbox.stub(Validator, 'validate').withArgs(payload, transferId).returns(P.reject(error))

      const reply = response => {
        test.equal(response, error)
        test.end()
      }

      Handler.prepareTransfer(createRequest(transferId, payload), reply)
    })

    prepareTransferTest.test('return error if transfer is already prepared', test => {
      const payload = {
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
        execution_condition: executionCondition,
        expires_at: '2015-06-16T00:00:01.000Z'
      }

      const error = new AlreadyExistsError()
      TransferService.prepare.returns(P.reject(error))

      const reply = response => {
        test.equal(response, error)
        test.end()
      }

      Handler.prepareTransfer(createRequest(Uuid(), payload), reply)
    })

    prepareTransferTest.end()
  })

  handlerTest.test('fulfillTransfer should', fulfillTransferTest => {
    fulfillTransferTest.test('return fulfilled transfer', test => {
      const transfer = {
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
        execution_condition: executionCondition,
        expires_at: '2015-06-16T00:00:01.000Z',
        timeline: {}
      }

      const fulfillment = { id: '3a2a1d9e-8640-4d2d-b06c-84f2cd613204', fulfillment: 'oAKAAA' }

      TransferService.fulfill.returns(P.resolve(transfer))

      const reply = response => {
        test.equal(response.id, transfer.id)
        return {
          code: statusCode => {
            test.equal(statusCode, 200)
            test.end()
          }
        }
      }

      Handler.fulfillTransfer(createRequest(fulfillment.id, fulfillment.fulfillment), reply)
    })

    fulfillTransferTest.test('return error if transfer is not prepared', test => {
      const fulfillment = { id: '3a2a1d9e-8640-4d2d-b06c-84f2cd613204', fulfillment: 'oAKAAA' }
      const error = new UnpreparedTransferError()
      TransferService.fulfill.returns(P.reject(error))

      const reply = response => {
        test.equal(response, error)
        test.end()
      }

      Handler.fulfillTransfer(createRequest(fulfillment.id, fulfillment.fulfillment), reply)
    })

    fulfillTransferTest.test('return error if transfer has no domain events', test => {
      const fulfillment = { id: '3a2a1d9e-8640-4d2d-b06c-84f2cd613204', fulfillment: 'oAKAAA' }

      const error = new NotFoundError()
      TransferService.fulfill.returns(P.reject(error))

      const reply = response => {
        test.equal(response, error)
        test.end()
      }

      Handler.fulfillTransfer(createRequest(fulfillment.id, fulfillment.fulfillment), reply)
    })

    fulfillTransferTest.end()
  })

  handlerTest.test('reject transfer', rejectTransferTest => {
    rejectTransferTest.test('should rejected transfer', test => {
      const transfer = {
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
        execution_condition: executionCondition,
        expires_at: '2015-06-16T00:00:01.000Z',
        timeline: {}
      }

      const rejectReason = 'error reason'
      const transferId = '3a2a1d9e-8640-4d2d-b06c-84f2cd613204'
      const request = {
        params: { id: transferId },
        payload: rejectReason
      }

      TransferService.reject.returns(P.resolve(transfer))

      const reply = response => {
        test.equal(response.id, transfer.id)
        test.ok(TransferService.reject.calledWith(Sinon.match({ id: transferId, rejection_reason: 'cancelled', message: rejectReason })))
        return {
          code: statusCode => {
            test.equal(statusCode, 200)
            test.end()
          }
        }
      }
      Handler.rejectTransfer(request, reply)
    })

    rejectTransferTest.test('return error if transfer has no domain events', test => {
      const rejectReason = 'error reason'
      const request = {
        params: { id: '3a2a1d9e-8640-4d2d-b06c-84f2cd613204' },
        payload: rejectReason
      }
      const error = new NotFoundError()
      TransferService.reject.returns(P.reject(error))

      const reply = response => {
        test.equal(response, error)
        test.end()
      }

      Handler.rejectTransfer(request, reply)
    })

    rejectTransferTest.end()
  })

  handlerTest.test('getTransferById should', getTransferByIdTest => {
    getTransferByIdTest.test('get transfer by transfer id', test => {
      const id = Uuid()

      const readModelTransfer = {
        transferUuid: id,
        ledger: hostname,
        debitAccountId: 1,
        debitAccountName: 'dfsp1',
        debitAmount: '25',
        creditAccountId: 2,
        creditAccountName: 'dfsp2',
        creditAmount: '15',
        creditRejected: 0,
        executionCondition: executionCondition,
        expiresAt: '2015-06-16T00:00:01.000Z',
        state: TransferState.PREPARED,
        preparedDate: new Date()
      }
      TransferService.getById.returns(P.resolve(readModelTransfer))

      const reply = response => {
        test.equal(response.id, `${hostname}/transfers/${readModelTransfer.transferUuid}`)
        test.equal(response.ledger, readModelTransfer.ledger)
        test.equal(response.debits.length, 1)
        test.equal(response.debits[0].account, `${hostname}/accounts/${readModelTransfer.debitAccountName}`)
        test.equal(response.debits[0].amount, readModelTransfer.debitAmount)
        test.equal(response.credits.length, 1)
        test.equal(response.credits[0].account, `${hostname}/accounts/${readModelTransfer.creditAccountName}`)
        test.equal(response.credits[0].amount, readModelTransfer.creditAmount)
        test.notOk(response.credits[0].rejected)
        test.notOk(response.credits[0].rejection_message)
        test.equal(response.execution_condition, readModelTransfer.executionCondition)
        test.equal(response.expires_at, readModelTransfer.expiresAt)
        test.equal(response.state, readModelTransfer.state)
        test.ok(response.timeline)
        test.equal(response.timeline.prepared_at, readModelTransfer.preparedDate)
        test.end()
      }

      Handler.getTransferById(createRequest(id), reply)
    })

    getTransferByIdTest.test('reply with NotFoundError if transfer null', test => {
      TransferService.getById.returns(P.resolve(null))
      const reply = response => {
        test.ok(response instanceof NotFoundError)
        test.equal(response.message, 'The requested resource could not be found.')
        test.end()
      }

      Handler.getTransferById(createRequest(), reply)
    })

    getTransferByIdTest.test('return error if model throws error', test => {
      const error = new Error()
      TransferService.getById.returns(P.reject(error))

      const reply = response => {
        test.equal(response, error)
        test.end()
      }

      Handler.getTransferById(createRequest(), reply)
    })

    getTransferByIdTest.end()
  })

  handlerTest.test('getTransferFulfillment should', getTransferFulfillmentTest => {
    getTransferFulfillmentTest.test('get fulfillment by transfer id', test => {
      const id = Uuid()

      const transfer = { transferUuid: id, fulfillment: 'oAKAAA', state: TransferState.EXECUTED }
      TransferService.getById.returns(P.resolve(transfer))

      const reply = response => {
        test.equal(response, transfer.fulfillment)
        return {
          type: type => {
            test.equal(type, 'text/plain')
            test.end()
          }
        }
      }

      Handler.getTransferFulfillment(createRequest(id), reply)
    })

    getTransferFulfillmentTest.test('reply with NotFoundError if transfer not executed', test => {
      const id = Uuid()

      const transfer = { transferUuid: id, fulfillment: 'oAKAAA', state: TransferState.PREPARED }
      TransferService.getById.returns(P.resolve(transfer))

      const reply = response => {
        test.ok(response instanceof NotFoundError)
        test.equal(response.message, 'The requested resource could not be found.')
        test.end()
      }

      Handler.getTransferFulfillment(createRequest(), reply)
    })

    getTransferFulfillmentTest.test('reply with NotFoundError if transfer null', test => {
      TransferService.getById.returns(P.resolve(null))

      const reply = response => {
        test.ok(response instanceof NotFoundError)
        test.equal(response.message, 'The requested resource could not be found.')
        test.end()
      }

      Handler.getTransferFulfillment(createRequest(), reply)
    })

    getTransferFulfillmentTest.test('return error if model throws error', test => {
      const error = new Error()
      TransferService.getById.returns(P.reject(error))

      const reply = response => {
        test.equal(response, error)
        test.end()
      }

      Handler.getTransferFulfillment(createRequest(), reply)
    })

    getTransferFulfillmentTest.end()
  })

  handlerTest.end()
})
