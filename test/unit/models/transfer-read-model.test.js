'use strict'

const src = '../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Moment = require('moment')
const Uuid = require('uuid4')
const Db = require(`${src}/lib/db`)
const UrlParser = require(`${src}/lib/urlparser`)
const TransfersReadModel = require(`${src}/models/transfers-read-model`)
const TransferState = require('../../../src/eventric/transfer/state')

function setupTransfersDb (transfers) {
  let db = { transfers: transfers }
  Db.connect.returns(P.resolve(db))
}

Test('transfer model', function (modelTest) {
  let sandbox

  modelTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Db, 'connect')
    sandbox.stub(UrlParser, 'idFromTransferUri')
    t.end()
  })

  modelTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  modelTest.test('saveTransferPrepared should', function (savePreparedTest) {
    let transferPreparedEvent = {
      id: 1,
      name: 'TransferPrepared',
      payload: {
        ledger: 'http://central-ledger.example',
        debits: [{
          account: 'http://central-ledger.example/accounts/dfsp1',
          amount: '50'
        }],
        credits: [{
          account: 'http://central-ledger.example/accounts/dfsp2',
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

    savePreparedTest.test('save transfer prepared event', function (assert) {
      let insertAsync = sandbox.stub()
      setupTransfersDb({ insertAsync: insertAsync })

      TransfersReadModel.saveTransferPrepared(transferPreparedEvent)
        .then(() => {
          let insertAsyncArg = insertAsync.firstCall.args[0]
          assert.equal(insertAsyncArg.transferUuid, transferPreparedEvent.aggregate.id)
          assert.equal(insertAsyncArg.state, 'prepared')
          assert.equal(insertAsyncArg.ledger, transferPreparedEvent.payload.ledger)
          assert.equal(insertAsyncArg.debitAccount, transferPreparedEvent.payload.debits[0].account)
          assert.equal(insertAsyncArg.debitAmount, transferPreparedEvent.payload.debits[0].amount)
          assert.notOk(insertAsyncArg.debitMemo)
          assert.notOk(insertAsyncArg.debitInvoice)
          assert.equal(insertAsyncArg.creditAccount, transferPreparedEvent.payload.credits[0].account)
          assert.equal(insertAsyncArg.creditAmount, transferPreparedEvent.payload.credits[0].amount)
          assert.notOk(insertAsyncArg.creditMemo)
          assert.notOk(insertAsyncArg.creditInvoice)
          assert.equal(insertAsyncArg.executionCondition, transferPreparedEvent.payload.execution_condition)
          assert.notOk(insertAsyncArg.cancellationCondition)
          assert.notOk(insertAsyncArg.rejectReason)
          assert.equal(insertAsyncArg.expiresAt, transferPreparedEvent.payload.expires_at)
          assert.notOk(insertAsyncArg.additionalInfo)
          assert.deepEqual(insertAsyncArg.preparedDate, Moment(transferPreparedEvent.timestamp))
          assert.end()
        })
    })

    savePreparedTest.test('return newly created transfer', function (assert) {
      let newTransfer = { transferUuid: transferPreparedEvent.aggregate.id }
      let insertAsync = sandbox.stub().returns(newTransfer)
      setupTransfersDb({ insertAsync: insertAsync })

      TransfersReadModel.saveTransferPrepared(transferPreparedEvent)
        .then(t => {
          assert.equal(t, newTransfer)
          assert.end()
        })
        .catch(err => {
          assert.fail(err)
        })
    })

    savePreparedTest.end()
  })

  modelTest.test('saveTransferExecuted should', function (saveExecutedTest) {
    let transferExecutedEvent = {
      id: 2,
      name: 'TransferExecuted',
      payload: {
        ledger: 'http://central-ledger.example',
        debits: [{
          account: 'http://central-ledger.example/accounts/dfsp1',
          amount: '50'
        }],
        credits: [{
          account: 'http://central-ledger.example/accounts/dfsp2',
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

    saveExecutedTest.test('retrieve existing prepared transfer and update fields', function (assert) {
      let foundTransfer = { transferUuid: transferExecutedEvent.aggregate.id, state: 'prepared' }

      let findOneAsync = sandbox.stub().returns(Promise.resolve(foundTransfer))
      let updateAsync = sandbox.stub()
      setupTransfersDb({ findOneAsync: findOneAsync, updateAsync: updateAsync })

      TransfersReadModel.saveTransferExecuted(transferExecutedEvent)
        .then(() => {
          let findOneAsyncArg = findOneAsync.firstCall.args[0]
          let updateAsyncArg = updateAsync.firstCall.args[0]

          assert.equal(findOneAsyncArg.transferUuid, transferExecutedEvent.aggregate.id)
          assert.equal(updateAsyncArg.transferUuid, foundTransfer.transferUuid)
          assert.equal(updateAsyncArg.state, 'executed')
          assert.equal(updateAsyncArg.fulfillment, transferExecutedEvent.payload.fulfillment)
          assert.deepEqual(updateAsyncArg.executedDate, Moment(transferExecutedEvent.timestamp))
          assert.end()
        })
    })

    saveExecutedTest.test('fail if prepared transfer not found', function (assert) {
      let findOneAsync = sandbox.stub().returns(Promise.resolve(null))
      setupTransfersDb({ findOneAsync: findOneAsync })

      TransfersReadModel.saveTransferExecuted(transferExecutedEvent)
        .then(() => {
          assert.fail('Should have thrown error')
          assert.end()
        })
        .catch(err => {
          assert.equal(err.message, 'The transfer ' + transferExecutedEvent.aggregate.id + ' must be in the prepared state to update to executed')
          assert.end()
        })
    })

    saveExecutedTest.end()
  })

  modelTest.test('saveTransferRejected should', function (saveRejectedTest) {
    let transferRejectedEvent = {
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

    saveRejectedTest.test('retrieve existing prepared transfer and update fields', function (assert) {
      let foundTransfer = { transferUuid: transferRejectedEvent.aggregate.id, state: 'prepared' }

      let findOneAsync = sandbox.stub().returns(Promise.resolve(foundTransfer))
      let updateAsync = sandbox.stub()
      setupTransfersDb({ findOneAsync: findOneAsync, updateAsync: updateAsync })

      TransfersReadModel.saveTransferRejected(transferRejectedEvent)
        .then(() => {
          let findOneAsyncArg = findOneAsync.firstCall.args[0]
          let updateAsyncArg = updateAsync.firstCall.args[0]

          assert.equal(findOneAsyncArg.transferUuid, transferRejectedEvent.aggregate.id)
          assert.equal(updateAsyncArg.transferUuid, foundTransfer.transferUuid)
          assert.equal(updateAsyncArg.state, 'rejected')
          assert.equal(updateAsyncArg.rejectionReason, 'cancelled')
          assert.equal(updateAsyncArg.creditRejected, 1)
          assert.equal(updateAsyncArg.creditRejectionMessage, transferRejectedEvent.payload.rejection_reason)
          assert.deepEqual(updateAsyncArg.rejectedDate, Moment(transferRejectedEvent.timestamp))
          assert.end()
        })
    })

    saveRejectedTest.test('fail if prepared transfer not found', function (assert) {
      let findOneAsync = sandbox.stub().returns(Promise.resolve(null))
      setupTransfersDb({ findOneAsync: findOneAsync })

      TransfersReadModel.saveTransferRejected(transferRejectedEvent)
        .then(() => {
          assert.fail('Should have thrown error')
          assert.end()
        })
        .catch(err => {
          assert.equal(err.message, 'The transfer ' + transferRejectedEvent.aggregate.id + ' must be in the prepared state to update to rejected')
          assert.end()
        })
    })

    saveRejectedTest.end()
  })

  modelTest.test('truncateReadTransfersReadModel should', function (truncateTest) {
    truncateTest.test('destroy all records', function (assert) {
      let destroyAsync = sandbox.stub()
      setupTransfersDb({ destroyAsync: destroyAsync })

      TransfersReadModel.truncateReadModel()
        .then(() => {
          let destroyAsyncArg = destroyAsync.firstCall.args[0]
          assert.deepEqual(destroyAsyncArg, {})
          assert.end()
        })
    })

    truncateTest.end()
  })

  modelTest.test('getByIdShould', function (getByIdTest) {
    getByIdTest.test('return exception if db.connect throws', function (assert) {
      let error = new Error()
      Db.connect.returns(Promise.reject(error))

      TransfersReadModel.getById(Uuid())
        .then(() => {
          assert.fail('Should have thrown error')
          assert.end()
        })
        .catch(err => {
          assert.equal(err, error)
          assert.end()
        })
    })

    getByIdTest.test('return exception if db.findOneAsync throws', function (assert) {
      let error = new Error()
      let findOneAsync = function () { return Promise.reject(error) }
      setupTransfersDb({ findOneAsync: findOneAsync })

      TransfersReadModel.getById(Uuid())
        .then(() => {
          assert.fail('Should have thrown error')
          assert.end()
        })
        .catch(err => {
          assert.equal(err, error)
          assert.end()
        })
    })

    getByIdTest.test('find transfer by transferUuid', function (assert) {
      let id = Uuid()
      let transfer = { id: id }
      let findOneAsync = sandbox.stub().returns(Promise.resolve(transfer))
      setupTransfersDb({ findOneAsync: findOneAsync })

      TransfersReadModel.getById(id)
        .then(found => {
          let findOneAsyncArg = findOneAsync.firstCall.args[0]
          assert.equal(found, transfer)
          assert.equal(findOneAsyncArg.transferUuid, id)
          assert.end()
        })
        .catch(err => {
          assert.fail(err)
          assert.end()
        })
    })

    getByIdTest.end()
  })

  modelTest.test('findExpired should', findExpiredTest => {
    findExpiredTest.test('find transfer by state and expires_at', t => {
      let transfer1 = { id: Uuid() }
      let transfer2 = { id: Uuid() }
      let expirationDate = new Date()
      let findAsync = sandbox.stub().returns(Promise.resolve([ transfer1, transfer2 ]))
      setupTransfersDb({ findAsync: findAsync })

      TransfersReadModel.findExpired(expirationDate)
      .then(found => {
        let findAsyncArg = findAsync.firstCall.args[0]
        t.equal(findAsyncArg.state, TransferState.PREPARED)
        t.equal(findAsyncArg['expiresAt <'], expirationDate.toISOString())
        t.end()
      })
    })

    findExpiredTest.test('default expires_at date', t => {
      let transfer1 = { id: Uuid() }
      let transfer2 = { id: Uuid() }
      let findAsync = sandbox.stub().returns(Promise.resolve([ transfer1, transfer2 ]))
      let expirationDate = new Date()
      sandbox.stub(Moment, 'utc')
      Moment.utc.returns(expirationDate)
      setupTransfersDb({ findAsync: findAsync })

      TransfersReadModel.findExpired()
      .then(found => {
        let findAsyncArg = findAsync.firstCall.args[0]
        t.equal(findAsyncArg.state, TransferState.PREPARED)
        t.equal(findAsyncArg['expiresAt <'], expirationDate.toISOString())
        t.end()
      })
    })

    findExpiredTest.end()
  })

  modelTest.end()
})
