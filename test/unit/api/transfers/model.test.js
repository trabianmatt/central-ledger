'use strict'

const Test = require('tape')
const Uuid = require('uuid4')
const Moment = require('moment')
const Proxyquire = require('proxyquire')
const Sinon = require('sinon')

function createModel (db, eventric) {
  return Proxyquire('../../../../src/api/transfers/model', {
    '../../lib/db': db,
    '../../lib/eventric': eventric
  })
}

function setupTransfersDb (transfers) {
  let db = { transfers: transfers }
  return {
    connect: () => Promise.resolve(db)
  }
}

function setupEventric (context) {
  return {
    getContext: () => Promise.resolve(context)
  }
}

Test('transfer model', function (modelTest) {
  modelTest.test('prepare should', function (prepareTest) {
    prepareTest.test('send PrepareTransfer command', function (assert) {
      let command = Sinon.stub()
      let model = createModel({}, setupEventric({ command: command }))
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
      model.prepare(payload)
        .then(() => {
          let commandArg1 = command.firstCall.args[0]
          let commandArg2 = command.firstCall.args[1]
          assert.equal(commandArg1, 'PrepareTransfer')
          assert.equal(commandArg2.id, '3a2a1d9e-8640-4d2d-b06c-84f2cd613204')
          assert.equal(commandArg2.ledger, payload.ledger)
          assert.deepEqual(commandArg2.debits, payload.debits)
          assert.deepEqual(commandArg2.credits, payload.credits)
          assert.equal(commandArg2.execution_condition, payload.execution_condition)
          assert.equal(commandArg2.expires_at, payload.expires_at)
          assert.end()
        })
    })

    prepareTest.end()
  })

  modelTest.test('fulfill should', function (fulfillTest) {
    fulfillTest.test('send FulfillTransfer command', function (assert) {
      let command = Sinon.stub()
      let model = createModel({}, setupEventric({ command: command }))
      let payload = { id: '3a2a1d9e-8640-4d2d-b06c-84f2cd613204', fulfillment: 'cf:0:_v8' }
      model.fulfill(payload)
        .then(() => {
          let commandArg1 = command.firstCall.args[0]
          let commandArg2 = command.firstCall.args[1]
          assert.equal(commandArg1, 'FulfillTransfer')
          assert.equal(commandArg2.id, payload.id)
          assert.equal(commandArg2.fulfillment, payload.fulfillment)
          assert.end()
        })
    })

    fulfillTest.end()
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
        id: '1d4f2a70-e0d6-42dc-9efb-6d23060ccd6f',
        name: 'Transfer'
      },
      context: 'Ledger',
      timestamp: 1474471273588
    }

    savePreparedTest.test('save transfer prepared event', function (assert) {
      let insertAsync = Sinon.stub()
      let model = createModel(setupTransfersDb({ insertAsync: insertAsync }), {})

      model.saveTransferPrepared(transferPreparedEvent)
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
      let newTransfer = { transferUuid: '1d4f2a70-e0d6-42dc-9efb-6d23060ccd6f' }
      let insertAsync = Sinon.stub().returns(newTransfer)
      let model = createModel(setupTransfersDb({ insertAsync: insertAsync }), {})

      model.saveTransferPrepared(transferPreparedEvent)
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
        id: '1d4f2a70-e0d6-42dc-9efb-6d23060ccd6f',
        name: 'Transfer'
      },
      context: 'Ledger',
      timestamp: 1474471284081
    }

    saveExecutedTest.test('retrieve existing prepared transfer and update fields', function (assert) {
      let foundTransfer = { transferUuid: transferExecutedEvent.aggregate.id, state: 'prepared' }

      let findOneAsync = Sinon.stub().returns(Promise.resolve(foundTransfer))
      let updateAsync = Sinon.stub()
      let model = createModel(setupTransfersDb({ findOneAsync: findOneAsync, updateAsync: updateAsync }), {})

      model.saveTransferExecuted(transferExecutedEvent)
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
      let findOneAsync = Sinon.stub().returns(Promise.resolve(null))
      let model = createModel(setupTransfersDb({ findOneAsync: findOneAsync }), {})

      model.saveTransferExecuted(transferExecutedEvent)
        .then(() => {
          assert.fail('Should have thrown error')
          assert.end()
        })
        .catch(err => {
          assert.equal(err.message, 'The transfer ' + transferExecutedEvent.aggregate.id + ' has not been saved as prepared yet')
          assert.end()
        })
    })

    saveExecutedTest.test('fail if transfer is already executed', function (assert) {
      let foundTransfer = { transferUuid: transferExecutedEvent.aggregate.id, state: 'executed' }

      let findOneAsync = Sinon.stub().returns(Promise.resolve(foundTransfer))
      let model = createModel(setupTransfersDb({ findOneAsync: findOneAsync }), {})

      model.saveTransferExecuted(transferExecutedEvent)
        .then(() => {
          assert.fail('Should have thrown error')
          assert.end()
        })
        .catch(err => {
          assert.equal(err.message, 'The transfer ' + transferExecutedEvent.aggregate.id + ' has already been saved as executed')
          assert.end()
        })
    })

    saveExecutedTest.end()
  })

  modelTest.test('truncateReadModel should', function (truncateTest) {
    truncateTest.test('destroy all records', function (assert) {
      let destroyAsync = Sinon.stub()
      let model = createModel(setupTransfersDb({ destroyAsync: destroyAsync }), {})

      model.truncateReadModel()
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
      let model = createModel({ connect: () => Promise.reject(error) }, {})

      model.getById(Uuid())
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
      let model = createModel(setupTransfersDb({ findOneAsync: findOneAsync }), {})

      model.getById(Uuid())
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
      let findOneAsync = Sinon.stub().returns(Promise.resolve(transfer))
      let model = createModel(setupTransfersDb({ findOneAsync: findOneAsync }), {})

      model.getById(id)
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

  modelTest.end()
})
