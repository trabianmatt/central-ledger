'use strict'

const src = '../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Uuid = require('uuid4')
const Moment = require('moment')
const UrlParser = require(`${src}/lib/urlparser`)
const ReadModel = require(`${src}/models/transfers-read-model`)
const SettleableTransfersReadModel = require(`${src}/models/settleable-transfers-read-model`)
const Account = require(`${src}/domain/account`)
const SettlementsModel = require(`${src}/models/settlements`)
const Commands = require(`${src}/commands/transfer`)
const Service = require(`${src}/services/transfer`)
const TransferState = require(`${src}/domain/transfer/state`)
const RejectionType = require(`${src}/domain/transfer/rejection-type`)

Test('Transfer Service tests', serviceTest => {
  let sandbox
  let hostname = 'http://some-host'

  serviceTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(ReadModel, 'findExpired')
    sandbox.stub(ReadModel, 'saveTransfer')
    sandbox.stub(ReadModel, 'updateTransfer')
    sandbox.stub(ReadModel, 'truncateTransfers')
    sandbox.stub(ReadModel, 'getTransfersByState')
    sandbox.stub(SettleableTransfersReadModel, 'getSettleableTransfers')
    sandbox.stub(Account, 'getByName')
    sandbox.stub(SettlementsModel, 'generateId')
    sandbox.stub(SettlementsModel, 'create')
    sandbox.stub(Commands, 'expire')
    sandbox.stub(Commands, 'settle')
    sandbox.stub(UrlParser, 'nameFromAccountUri')
    t.end()
  })

  serviceTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  serviceTest.test('rejectExpired should', rejectTest => {
    rejectTest.test('find expired transfers and reject them', test => {
      let transfers = [{ transferUuid: 1 }, { transferUuid: 2 }]
      ReadModel.findExpired.returns(P.resolve(transfers))
      transfers.forEach((x, i) => {
        Commands.expire.onCall(i).returns(P.resolve({ transfer: { id: x.transferUuid }, rejection_reason: 'expired' }))
      })
      Service.rejectExpired()
      .then(x => {
        transfers.forEach(t => {
          test.ok(Commands.expire.calledWith(t.transferUuid))
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

  serviceTest.test('getExecuted should', getExecutedTest => {
    getExecutedTest.test('find executed transfers', assert => {
      let transfers = [{ transferUuid: 1 }, { transferUuid: 2 }]
      ReadModel.getTransfersByState.returns(P.resolve(transfers))

      Service.getExecuted()
        .then(found => {
          assert.equal(found, transfers)
          assert.ok(ReadModel.getTransfersByState.calledWith(TransferState.EXECUTED))
          assert.end()
        })
    })
    getExecutedTest.end()
  })

  serviceTest.test('saveTransferPrepared should', preparedTest => {
    let dfsp1Account = { accountId: 1, name: 'dfsp1', url: `${hostname}/accounts/dfsp1` }
    let dfsp2Account = { accountId: 2, name: 'dfsp2', url: `${hostname}/accounts/dfsp2` }

    let event = {
      id: 1,
      name: 'TransferPrepared',
      payload: {
        ledger: `${hostname}`,
        debits: [{
          account: dfsp1Account.url,
          amount: '50'
        }],
        credits: [{
          account: dfsp2Account.url,
          amount: '50'
        }],
        execution_condition: 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2',
        expires_at: '2015-06-16T00:00:01.000Z'
      },
      aggregate: {
        id: Uuid(),
        name: 'Transfer'
      },
      context: 'Ledger',
      timestamp: 1474471273588
    }

    preparedTest.test('save transfer record to read model', assert => {
      UrlParser.nameFromAccountUri.withArgs(dfsp1Account.url).returns(dfsp1Account.name)
      UrlParser.nameFromAccountUri.withArgs(dfsp2Account.url).returns(dfsp2Account.name)
      Account.getByName.withArgs(dfsp1Account.name).returns(Promise.resolve(dfsp1Account))
      Account.getByName.withArgs(dfsp2Account.name).returns(Promise.resolve(dfsp2Account))
      ReadModel.saveTransfer.returns(P.resolve({}))

      Service.saveTransferPrepared(event)
        .then(() => {
          assert.ok(ReadModel.saveTransfer.calledWith(Sinon.match({
            transferUuid: event.aggregate.id,
            state: TransferState.PREPARED,
            ledger: event.payload.ledger,
            debitAccountId: dfsp1Account.accountId,
            debitAmount: event.payload.debits[0].amount,
            debitMemo: undefined,
            debitInvoice: undefined,
            creditAccountId: dfsp2Account.accountId,
            creditAmount: event.payload.credits[0].amount,
            creditMemo: undefined,
            creditInvoice: undefined,
            executionCondition: event.payload.execution_condition,
            cancellationCondition: undefined,
            rejectReason: undefined,
            expiresAt: event.payload.expires_at,
            additionalInfo: undefined,
            preparedDate: Moment(event.timestamp)
          })))
          assert.end()
        })
    })
    preparedTest.end()
  })

  serviceTest.test('saveTransferExecuted should', executedTest => {
    let event = {
      id: 2,
      name: 'TransferExecuted',
      payload: {
        ledger: `${hostname}`,
        debits: [{
          account: `${hostname}/accounts/dfsp1`,
          amount: '50'
        }],
        credits: [{
          account: `${hostname}/accounts/dfsp2`,
          amount: '50'
        }],
        execution_condition: 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2',
        expires_at: '2015-06-16T00:00:01.000Z',
        fulfillment: 'cf:0:_v8'
      },
      aggregate: {
        id: Uuid(),
        name: 'Transfer'
      },
      context: 'Ledger',
      timestamp: 1474471284081
    }

    executedTest.test('update transfer in read model', assert => {
      ReadModel.updateTransfer.returns(P.resolve({}))

      Service.saveTransferExecuted(event)
        .then(() => {
          assert.ok(ReadModel.updateTransfer.calledWith(event.aggregate.id, Sinon.match({
            state: TransferState.EXECUTED,
            fulfillment: event.payload.fulfillment,
            executedDate: Moment(event.timestamp)
          })))
          assert.end()
        })
    })
    executedTest.end()
  })

  serviceTest.test('saveTransferRejected should', rejectedTest => {
    let event = {
      id: 2,
      name: 'TransferRejected',
      payload: {
        rejection_reason: 'this is a bad transfer'
      },
      aggregate: {
        id: Uuid(),
        name: 'Transfer'
      },
      context: 'Ledger',
      timestamp: 1474471286000
    }

    rejectedTest.test('update transfer in read model', assert => {
      ReadModel.updateTransfer.returns(P.resolve({}))

      Service.saveTransferRejected(event)
        .then(() => {
          assert.ok(ReadModel.updateTransfer.calledWith(event.aggregate.id, Sinon.match({
            state: TransferState.REJECTED,
            rejectionReason: RejectionType.CANCELED,
            creditRejected: 1,
            creditRejectionMessage: event.payload.rejection_reason,
            rejectedDate: Moment(event.timestamp)
          })))
          assert.end()
        })
    })

    rejectedTest.test('update rejectionReason if event provides one', assert => {
      ReadModel.updateTransfer.returns(P.resolve({}))

      event.payload.rejection_type = RejectionType.EXPIRED

      Service.saveTransferRejected(event)
        .then(() => {
          assert.ok(ReadModel.updateTransfer.calledWith(event.aggregate.id, Sinon.match({
            state: TransferState.REJECTED,
            rejectionReason: RejectionType.EXPIRED,
            creditRejected: 1,
            creditRejectionMessage: event.payload.rejection_reason,
            rejectedDate: Moment(event.timestamp)
          })))
          assert.end()
        })
    })
    rejectedTest.end()
  })

  serviceTest.test('truncateReadModel should', truncateTest => {
    truncateTest.test('call read model to truncate transfers', assert => {
      ReadModel.truncateTransfers.returns(P.resolve({}))

      Service.truncateReadModel()
        .then(() => {
          assert.ok(ReadModel.truncateTransfers.called)
          assert.end()
        })
    })
    truncateTest.end()
  })

  serviceTest.end()
})
