'use strict'

const src = '../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Moment = require('moment')
const Uuid = require('uuid4')
const Db = require(`${src}/db`)
const UrlParser = require(`${src}/lib/urlparser`)
const TransfersReadModel = require(`${src}/models/transfers-read-model`)
const TransferState = require(`${src}/domain/transfer/state`)

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

  modelTest.test('saveTransfer should', function (saveTransferTest) {
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

    saveTransferTest.test('insert transfer record', function (assert) {
      let insertAsync = sandbox.stub()
      setupTransfersDb({ insertAsync: insertAsync })

      TransfersReadModel.saveTransfer(transferRecord)
        .then(() => {
          assert.ok(insertAsync.calledWith(Sinon.match(transferRecord)))
          assert.end()
        })
    })

    saveTransferTest.test('return newly created transfer', function (assert) {
      let newTransfer = { transferUuid: Uuid() }
      let insertAsync = sandbox.stub().returns(newTransfer)
      setupTransfersDb({ insertAsync: insertAsync })

      TransfersReadModel.saveTransfer(transferRecord)
        .then(t => {
          assert.equal(t, newTransfer)
          assert.end()
        })
        .catch(err => {
          assert.fail(err)
        })
    })

    saveTransferTest.end()
  })

  modelTest.test('updateTransfer should', function (updateTransferTest) {
    updateTransferTest.test('update transfer record', function (assert) {
      let updateAsync = sandbox.stub()
      setupTransfersDb({ updateAsync: updateAsync })

      let transferId = Uuid()
      let fields = { state: TransferState.EXECUTED, fulfillment: 'oAKAAA' }

      TransfersReadModel.updateTransfer(transferId, fields)
        .then(() => {
          assert.ok(updateAsync.calledWith(Sinon.match({
            transferUuid: transferId,
            state: fields.state,
            fulfillment: fields.fulfillment
          })))
          assert.end()
        })
    })

    updateTransferTest.end()
  })

  modelTest.test('truncateTransfers should', function (truncateTest) {
    truncateTest.test('destroy all transfers records', function (assert) {
      let destroyAsync = sandbox.stub()
      setupTransfersDb({ destroyAsync: destroyAsync })

      TransfersReadModel.truncateTransfers()
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

    getByIdTest.test('return exception if db.getTransferByIdAsync throws', function (assert) {
      let error = new Error()

      let getTransferByIdAsync = function () { return Promise.reject(error) }
      let db = { getTransferByIdAsync: getTransferByIdAsync }
      Db.connect.returns(P.resolve(db))

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
      let transfer = [{ id: id }]
      let getTransferByIdAsync = sandbox.stub().returns(Promise.resolve(transfer))

      let db = { getTransferByIdAsync: getTransferByIdAsync }
      Db.connect.returns(P.resolve(db))

      TransfersReadModel.getById(id)
        .then(found => {
          let getTransferByIdAsyncArg = getTransferByIdAsync.firstCall.args[0]
          assert.equal(found, transfer[0])
          assert.equal(getTransferByIdAsyncArg, id)
          assert.end()
        })
        .catch(err => {
          assert.fail(err)
          assert.end()
        })
    })

    getByIdTest.end()
  })

  modelTest.test('getTransfersByState should', getByStateTest => {
    getByStateTest.test('find transfers by state', test => {
      let transfers = [{ transferUuid: Uuid() }, { transferUuid: Uuid() }]
      let getTransfersByStateAsync = sandbox.stub().returns(Promise.resolve(transfers))

      let db = { getTransfersByStateAsync: getTransfersByStateAsync }
      Db.connect.returns(P.resolve(db))

      TransfersReadModel.getTransfersByState(TransferState.EXECUTED)
        .then(found => {
          let getTransfersByStateAsyncArg = getTransfersByStateAsync.firstCall.args[0]
          test.equal(getTransfersByStateAsyncArg, TransferState.EXECUTED)
          test.deepEqual(found, transfers)
          test.end()
        })
    })
    getByStateTest.end()
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
