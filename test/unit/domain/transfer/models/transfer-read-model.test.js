'use strict'

const src = '../../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Moment = require('moment')
const Uuid = require('uuid4')
const Db = require(`${src}/db`)
const UrlParser = require(`${src}/lib/urlparser`)
const TransfersReadModel = require(`${src}/domain/transfer/models/transfers-read-model`)
const TransferState = require(`${src}/domain/transfer/state`)

Test('transfer model', modelTest => {
  let sandbox
  let transfersStubs

  modelTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()

    transfersStubs = {
      insert: sandbox.stub(),
      where: sandbox.stub(),
      update: sandbox.stub(),
      truncate: sandbox.stub()
    }

    Db.transfers = sandbox.stub().returns(transfersStubs)

    sandbox.stub(UrlParser, 'idFromTransferUri')
    t.end()
  })

  modelTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  modelTest.test('saveTransfer should', saveTransferTest => {
    let transferRecord = {
      transferUuid: Uuid(),
      state: TransferState.PREPARED,
      ledger: 'http://central-ledger.example',
      debitAccountId: 1,
      debitAmount: '50',
      creditAccountId: 2,
      creditAmount: '50',
      executionCondition: 'ni:///sha-256;47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU?fpt=preimage-sha-256&cost=0',
      expiresAt: '2015-06-16T00:00:01.000Z',
      preparedDate: Moment(1474471273588)
    }

    saveTransferTest.test('insert transfer and return newly created record', test => {
      let saved = { transferUuid: transferRecord.transferUuid }

      transfersStubs.insert.returns(P.resolve([saved]))

      TransfersReadModel.saveTransfer(transferRecord)
        .then(s => {
          test.ok(transfersStubs.insert.withArgs(transferRecord).calledOnce)
          test.equal(s, saved)
          test.end()
        })
    })

    saveTransferTest.end()
  })

  modelTest.test('updateTransfer should', updateTransferTest => {
    updateTransferTest.test('update transfer record', test => {
      let transferId = Uuid()
      let fields = { state: TransferState.EXECUTED, fulfillment: 'oAKAAA' }
      let updatedTransfer = { transferUuid: transferId }

      let updateStub = sandbox.stub().returns(P.resolve([updatedTransfer]))
      transfersStubs.where.returns({ update: updateStub })

      TransfersReadModel.updateTransfer(transferId, fields)
        .then(u => {
          test.ok(transfersStubs.where.withArgs({ transferUuid: transferId }.calledOnce))
          test.ok(updateStub.withArgs(fields, '*').calledOnce)
          test.equal(u, updatedTransfer)
          test.end()
        })
    })

    updateTransferTest.end()
  })

  modelTest.test('truncateTransfers should', truncateTest => {
    truncateTest.test('destroy all transfers records', test => {
      transfersStubs.truncate.returns(P.resolve())

      TransfersReadModel.truncateTransfers()
        .then(() => {
          test.ok(transfersStubs.truncate.calledOnce)
          test.end()
        })
    })

    truncateTest.end()
  })

  modelTest.test('getByIdShould', getByIdTest => {
    getByIdTest.test('find transfer by transferUuid', test => {
      let id = Uuid()
      let transfer = { id: id }

      let joinDebitStub = sandbox.stub()
      let joinCreditStub = sandbox.stub()
      let selectStub = sandbox.stub()

      transfersStubs.where.returns({
        innerJoin: joinCreditStub.returns({
          innerJoin: joinDebitStub.returns({
            select: selectStub.returns({
              first: sandbox.stub().returns(P.resolve(transfer))
            })
          })
        })
      })

      TransfersReadModel.getById(id)
        .then(found => {
          test.ok(transfersStubs.where.withArgs({ transferUuid: id }).calledOnce)
          test.ok(joinCreditStub.withArgs('accounts AS ca', 'transfers.creditAccountId', 'ca.accountId').calledOnce)
          test.ok(joinDebitStub.withArgs('accounts AS da', 'transfers.debitAccountId', 'da.accountId').calledOnce)
          test.ok(selectStub.withArgs('transfers.*', 'ca.name AS creditAccountName', 'da.name AS debitAccountName').calledOnce)
          test.equal(found, transfer)
          test.end()
        })
    })

    getByIdTest.end()
  })

  modelTest.test('findExpired should', findExpiredTest => {
    findExpiredTest.test('find transfer by state and expires_at', test => {
      let transfer1 = { id: Uuid() }
      let transfer2 = { id: Uuid() }
      let expiredTransfers = [transfer1, transfer2]
      let expirationDate = new Date()

      let andWhereStub = sandbox.stub().returns(P.resolve(expiredTransfers))
      transfersStubs.where.returns({ andWhere: andWhereStub })

      TransfersReadModel.findExpired(expirationDate)
        .then(found => {
          test.ok(transfersStubs.where.withArgs({ state: TransferState.PREPARED }).calledOnce)
          test.ok(andWhereStub.withArgs('expiresAt', '<', expirationDate.toISOString()).calledOnce)
          test.equal(found, expiredTransfers)
          test.end()
        })
    })

    findExpiredTest.test('default expires_at date', test => {
      let transfer1 = { id: Uuid() }
      let transfer2 = { id: Uuid() }
      let expiredTransfers = [transfer1, transfer2]

      let expirationDate = new Date()
      sandbox.stub(Moment, 'utc')
      Moment.utc.returns(expirationDate)

      let andWhereStub = sandbox.stub().returns(P.resolve(expiredTransfers))
      transfersStubs.where.returns({ andWhere: andWhereStub })

      TransfersReadModel.findExpired()
        .then(found => {
          test.ok(transfersStubs.where.withArgs({ state: TransferState.PREPARED }).calledOnce)
          test.ok(andWhereStub.withArgs('expiresAt', '<', expirationDate.toISOString()).calledOnce)
          test.equals(found, expiredTransfers)
          test.end()
        })
    })

    findExpiredTest.end()
  })

  modelTest.end()
})
