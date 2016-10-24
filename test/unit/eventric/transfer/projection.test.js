'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Projection = require('../../../../src/eventric/transfer/projection')
const TransfersReadModel = require('../../../../src/models/transfers-read-model')

Test('Projection', projectionTest => {
  let sandbox

  projectionTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(TransfersReadModel, 'truncateReadModel')
    sandbox.stub(TransfersReadModel, 'saveTransferPrepared')
    sandbox.stub(TransfersReadModel, 'saveTransferExecuted')
    sandbox.stub(TransfersReadModel, 'saveTransferRejected')
    sandbox.stub(console, 'error')
    sandbox.stub(console, 'info')
    t.end()
  })

  projectionTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  projectionTest.test('Initialize should', initTest => {
    initTest.test('truncate read model and call done', t => {
      TransfersReadModel.truncateReadModel.returns(P.resolve())

      let done = sandbox.stub()

      Projection.initialize({}, done)
      .then(result => {
        t.ok(done.calledOnce)
        t.end()
      })
    })

    initTest.test('log error thrown by truncateReadModel', t => {
      let error = new Error()
      TransfersReadModel.truncateReadModel.returns(P.reject(error))

      let done = sandbox.stub()

      Projection.initialize({}, done)
      .then(result => {
        t.notOk(done.called)
        t.ok(console.error.calledWith('Error truncating read model', error))
        t.end()
      })
    })

    initTest.end()
  })

  projectionTest.test('handleTransferPrepared should', preparedTest => {
    preparedTest.test('saveTransferPrepared and log to info', t => {
      let event = {}
      let transfer = { transferUuid: 'uuid' }

      TransfersReadModel.saveTransferPrepared.withArgs(event).returns(P.resolve(transfer))

      Projection.handleTransferPrepared(event)
      .then(result => {
        t.ok(TransfersReadModel.saveTransferPrepared.calledOnce)
        t.ok(console.info.calledWith('Saved TransferPrepared event for transfer ' + transfer.transferUuid))
        t.end()
      })
    })

    preparedTest.test('log error', t => {
      let error = new Error()
      let event = {}
      TransfersReadModel.saveTransferPrepared.withArgs(event).returns(P.reject(error))

      Projection.handleTransferPrepared(event)
      .then(() => {
        t.ok(console.error.calledWith('Error saving TransferPrepared event', error))
        t.end()
      })
    })

    preparedTest.end()
  })

  projectionTest.test('handleTransferExecuted should', executedTest => {
    executedTest.test('saveTransferExecuted and log to info', t => {
      let event = {}
      let transfer = { transferUuid: 'uuid' }

      TransfersReadModel.saveTransferExecuted.withArgs(event).returns(P.resolve(transfer))

      Projection.handleTransferExecuted(event)
      .then(result => {
        t.ok(TransfersReadModel.saveTransferExecuted.calledOnce)
        t.ok(console.info.calledWith('Saved TransferExecuted event for transfer ' + transfer.transferUuid))
        t.end()
      })
    })

    executedTest.test('log error', t => {
      let error = new Error()
      let event = {}
      TransfersReadModel.saveTransferExecuted.withArgs(event).returns(P.reject(error))

      Projection.handleTransferExecuted(event)
      .then(() => {
        t.ok(console.error.calledWith('Error saving TransferExecuted event', error))
        t.end()
      })
    })

    executedTest.end()
  })

  projectionTest.test('handleTransferRejected should', rejectedTest => {
    rejectedTest.test('saveTransferRejected and log to info', t => {
      let event = {}
      let transfer = { transferUuid: 'uuid' }

      TransfersReadModel.saveTransferRejected.withArgs(event).returns(P.resolve(transfer))

      Projection.handleTransferRejected(event)
      .then(result => {
        t.ok(TransfersReadModel.saveTransferRejected.calledWith(event))
        t.ok(console.info.calledWith('Saved TransferRejected event for transfer ' + transfer.transferUuid))
        t.end()
      })
    })

    rejectedTest.test('log error', t => {
      let error = new Error()
      let event = {}
      TransfersReadModel.saveTransferRejected.withArgs(event).returns(P.reject(error))

      Projection.handleTransferRejected(event)
      .then(() => {
        t.ok(console.error.calledWith('Error saving TransferRejected event', error))
        t.end()
      })
    })

    rejectedTest.end()
  })

  projectionTest.end()
})
