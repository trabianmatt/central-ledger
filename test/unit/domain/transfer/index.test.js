'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Uuid = require('uuid4')
const TransfersReadModel = require(`${src}/domain/transfer/models/transfers-read-model`)
const SettleableTransfersReadModel = require(`${src}/models/settleable-transfers-read-model`)
const SettlementsModel = require(`${src}/models/settlements`)
const Events = require('../../../../src/lib/events')
const Commands = require('../../../../src/domain/transfer/commands')
const Service = require('../../../../src/domain/transfer')
const TransferTranslator = require('../../../../src/domain/transfer/translator')
const RejectionType = require(`${src}/domain/transfer/rejection-type`)
const ExpiredTransferError = require(`${src}/errors/expired-transfer-error`)

const createTransfer = (transferId = '3a2a1d9e-8640-4d2d-b06c-84f2cd613204') => {
  return {
    id: transferId,
    ledger: 'ledger',
    credits: [],
    debits: [],
    execution_condition: '',
    expires_at: ''
  }
}

Test('Transfer Service tests', serviceTest => {
  let sandbox

  serviceTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(TransfersReadModel, 'findExpired')
    sandbox.stub(TransfersReadModel, 'getById')
    sandbox.stub(SettleableTransfersReadModel, 'getSettleableTransfers')
    sandbox.stub(SettlementsModel, 'generateId')
    sandbox.stub(SettlementsModel, 'create')
    sandbox.stub(TransferTranslator, 'toTransfer')
    sandbox.stub(TransferTranslator, 'fromPayload')
    sandbox.stub(Events, 'emitTransferRejected')
    sandbox.stub(Events, 'emitTransferExecuted')
    sandbox.stub(Events, 'emitTransferPrepared')
    sandbox.stub(Commands, 'settle')
    sandbox.stub(Commands, 'reject')
    sandbox.stub(Commands, 'fulfill')
    sandbox.stub(Commands, 'prepare')
    t.end()
  })

  serviceTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  serviceTest.test('getById should', getByIdTest => {
    getByIdTest.test('return result from read model', test => {
      const id = Uuid()
      const transfer = {}
      const transferPromise = P.resolve(transfer)
      TransfersReadModel.getById.withArgs(id).returns(transferPromise)
      test.equal(Service.getById(id), transferPromise)
      test.end()
    })
    getByIdTest.end()
  })

  serviceTest.test('rejectExpired should', rejectTest => {
    rejectTest.test('find expired transfers and reject them', test => {
      let transfers = [{ transferUuid: 1 }, { transferUuid: 2 }]
      TransfersReadModel.findExpired.returns(P.resolve(transfers))
      transfers.forEach((x, i) => {
        Commands.reject.onCall(i).returns(P.resolve({ id: x.transferUuid }))
        TransferTranslator.toTransfer.onCall(i).returns({ id: x.transferUuid })
      })
      Service.rejectExpired()
      .then(x => {
        transfers.forEach(t => {
          test.ok(Commands.reject.calledWith({ id: t.transferUuid, rejection_reason: RejectionType.EXPIRED }))
        })
        test.deepEqual(x, transfers.map(t => t.transferUuid))
        test.end()
      })
    })
    rejectTest.end()
  })

  serviceTest.test('settle should', settleTest => {
    settleTest.test('find settalble transfers and settle them', test => {
      let settlementId = Uuid()
      SettlementsModel.generateId.returns(settlementId)
      SettlementsModel.create.withArgs(settlementId).returns(P.resolve({ settlementId: settlementId, settledAt: 0 }))

      let transfers = [{ transferId: 1 }, { transferId: 2 }]
      SettleableTransfersReadModel.getSettleableTransfers.returns(P.resolve(transfers))

      transfers.forEach((x, i) => {
        Commands.settle.onCall(i).returns(P.resolve({ id: x.id }))
      })

      Service.settle()
      .then(x => {
        transfers.forEach(t => {
          test.ok(Commands.settle.calledWith({id: t.transferId, settlement_id: settlementId}))
        })
        test.deepEqual(x, transfers.map(t => t.id))
        test.end()
      })
    })

    settleTest.test('return empty array if no settleable transfers exist', test => {
      let settlementId = Uuid()
      SettlementsModel.generateId.returns(settlementId)
      SettlementsModel.create.withArgs(settlementId).returns(P.resolve({ settlementId: settlementId, settledAt: 0 }))

      SettleableTransfersReadModel.getSettleableTransfers.returns(P.resolve([]))

      Service.settle()
      .then(x => {
        test.deepEqual(x, [])
        test.end()
      })
    })

    settleTest.end()
  })

  serviceTest.test('prepare should', prepareTest => {
    prepareTest.test('execute prepare function', test => {
      const payload = { id: 'payload id' }
      const proposedTransfer = { id: 'transfer id' }
      TransferTranslator.fromPayload.withArgs(payload).returns(proposedTransfer)

      const preparedTransfer = { id: 'prepared transfer' }
      const prepareResult = { existing: false, transfer: preparedTransfer }
      Commands.prepare.withArgs(proposedTransfer).returns(P.resolve(prepareResult))

      const expectedTransfer = { id: 'expected transfer' }
      TransferTranslator.toTransfer.withArgs(preparedTransfer).returns(expectedTransfer)

      Service.prepare(payload)
        .then(result => {
          test.equal(result.existing, prepareResult.existing)
          test.equal(result.transfer, expectedTransfer)
          test.ok(Commands.prepare.calledWith(proposedTransfer))
          test.end()
        })
    })

    prepareTest.test('Emit transfer prepared event', test => {
      const payload = { id: 'payload id' }
      const proposedTransfer = { id: 'transfer id' }
      TransferTranslator.fromPayload.withArgs(payload).returns(proposedTransfer)

      const preparedTransfer = { id: 'prepared transfer' }
      const prepareResult = { existing: false, transfer: preparedTransfer }
      Commands.prepare.withArgs(proposedTransfer).returns(P.resolve(prepareResult))

      const expectedTransfer = { id: 'expected transfer' }
      TransferTranslator.toTransfer.withArgs(preparedTransfer).returns(expectedTransfer)

      Service.prepare(payload)
        .then(result => {
          test.ok(Events.emitTransferPrepared.calledWith(expectedTransfer))
          test.end()
        })
    })

    prepareTest.end()
  })

  serviceTest.test('fulfill should', fulfillTest => {
    fulfillTest.test('execute fulfill command', function (assert) {
      let fulfillment = 'oAKAAA'
      let transferId = '3a2a1d9e-8640-4d2d-b06c-84f2cd613204'
      let expandedId = 'http://central-ledger/transfers/' + transferId
      TransferTranslator.toTransfer.returns({ id: expandedId })
      let payload = { id: transferId, fulfillment }
      let transfer = createTransfer(transferId)
      transfer.id = transferId
      Commands.fulfill.withArgs(payload).returns(P.resolve(transfer))
      Service.fulfill(payload)
        .then(result => {
          assert.equal(result.id, expandedId)
          assert.ok(Commands.fulfill.calledWith(payload))
          assert.end()
        })
    })

    fulfillTest.test('Emit transfer executed event', t => {
      let fulfillment = 'oAKAAA'
      let transferId = '3a2a1d9e-8640-4d2d-b06c-84f2cd613204'
      let expandedId = 'http://central-ledger/transfers/' + transferId
      TransferTranslator.toTransfer.returns({ id: expandedId })
      let payload = { id: transferId, fulfillment }
      let transfer = createTransfer(transferId)
      Commands.fulfill.withArgs(payload).returns(P.resolve(transfer))
      Service.fulfill(payload)
        .then(result => {
          let emitArgs = Events.emitTransferExecuted.firstCall.args
          let args0 = emitArgs[0]
          t.equal(args0.id, expandedId)
          let args1 = emitArgs[1]
          t.equal(args1.execution_condition_fulfillment, fulfillment)
          t.end()
        })
    })

    fulfillTest.test('reject and throw error if transfer is expired', assert => {
      let fulfillment = 'oAKAAA'
      let transfer = createTransfer()
      let payload = { id: transfer.id, fulfillment }

      Commands.fulfill.withArgs(payload).returns(P.reject(new ExpiredTransferError()))
      Commands.reject.returns(P.resolve({ transfer }))
      Service.fulfill(payload)
      .then(() => {
        assert.fail('Expected exception')
        assert.end()
      })
      .catch(e => {
        assert.ok(Commands.reject.calledWith({ id: transfer.id, rejection_reason: RejectionType.EXPIRED }))
        assert.equal(e.name, 'UnpreparedTransferError')
        assert.end()
      })
    })

    fulfillTest.end()
  })

  serviceTest.test('reject should', rejectTest => {
    rejectTest.test('execute reject command', test => {
      const rejectionReason = 'some reason'
      const transferId = Uuid()
      const response = {}
      const transfer = { id: transferId }
      const payload = { id: transferId, rejection_reason: rejectionReason }
      Commands.reject.withArgs(payload).returns(P.resolve(transfer))
      TransferTranslator.toTransfer.withArgs(transfer).returns(response)

      Service.reject(payload)
        .then(result => {
          test.equal(result, response)
          test.ok(Commands.reject.calledWith(payload))
          test.end()
        })
    })

    rejectTest.test('emit transfer rejected event', test => {
      const transfer = {}
      Commands.reject.returns(P.resolve(transfer))
      const cleanTransfer = { id: Uuid() }
      TransferTranslator.toTransfer.withArgs(transfer).returns(cleanTransfer)
      Service.reject({})
        .then(result => {
          test.ok(Events.emitTransferRejected.calledWith(cleanTransfer))
          test.end()
        })
    })

    rejectTest.end()
  })

  serviceTest.end()
})
