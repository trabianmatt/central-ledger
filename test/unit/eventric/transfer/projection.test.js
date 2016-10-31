'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Logger = require(`${src}/lib/logger`)
const TransferService = require(`${src}/services/transfer`)
const Projection = require(`${src}/eventric/transfer/projection`)

Test('Projection', projectionTest => {
  let sandbox

  projectionTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(TransferService, 'truncateReadModel')
    sandbox.stub(TransferService, 'saveTransferPrepared')
    sandbox.stub(TransferService, 'saveTransferExecuted')
    sandbox.stub(TransferService, 'saveTransferRejected')
    sandbox.stub(Logger, 'error')
    sandbox.stub(Logger, 'info')
    t.end()
  })

  projectionTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  projectionTest.test('Initialize should', initTest => {
    initTest.test('truncate read model and call done', t => {
      TransferService.truncateReadModel.returns(P.resolve())

      let done = sandbox.stub()

      Projection.initialize({}, done)
      .then(result => {
        t.ok(done.calledOnce)
        t.end()
      })
    })

    initTest.test('log error thrown by truncateReadModel', t => {
      let error = new Error()
      TransferService.truncateReadModel.returns(P.reject(error))

      let done = sandbox.stub()

      Projection.initialize({}, done)
      .then(result => {
        t.notOk(done.called)
        t.ok(Logger.error.calledWith('Error truncating read model', error))
        t.end()
      })
    })

    initTest.end()
  })

  projectionTest.test('handleTransferPrepared should', preparedTest => {
    preparedTest.test('saveTransferPrepared and log to info', t => {
      let event = {}
      let transfer = { transferUuid: 'uuid' }

      TransferService.saveTransferPrepared.withArgs(event).returns(P.resolve(transfer))

      Projection.handleTransferPrepared(event)
      .then(result => {
        t.ok(TransferService.saveTransferPrepared.calledOnce)
        t.ok(Logger.info.calledWith('Saved TransferPrepared event for transfer ' + transfer.transferUuid))
        t.end()
      })
    })

    preparedTest.test('log error', t => {
      let error = new Error()
      let event = {}
      TransferService.saveTransferPrepared.withArgs(event).returns(P.reject(error))

      Projection.handleTransferPrepared(event)
      .then(() => {
        t.ok(Logger.error.calledWith('Error saving TransferPrepared event', error))
        t.end()
      })
    })

    preparedTest.end()
  })

  projectionTest.test('handleTransferExecuted should', executedTest => {
    executedTest.test('saveTransferExecuted and log to info', t => {
      let event = {}
      let transfer = { transferUuid: 'uuid' }

      TransferService.saveTransferExecuted.withArgs(event).returns(P.resolve(transfer))

      Projection.handleTransferExecuted(event)
      .then(result => {
        t.ok(TransferService.saveTransferExecuted.calledOnce)
        t.ok(Logger.info.calledWith('Saved TransferExecuted event for transfer ' + transfer.transferUuid))
        t.end()
      })
    })

    executedTest.test('log error', t => {
      let error = new Error()
      let event = {}
      TransferService.saveTransferExecuted.withArgs(event).returns(P.reject(error))

      Projection.handleTransferExecuted(event)
      .then(() => {
        t.ok(Logger.error.calledWith('Error saving TransferExecuted event', error))
        t.end()
      })
    })

    executedTest.end()
  })

  projectionTest.test('handleTransferRejected should', rejectedTest => {
    rejectedTest.test('saveTransferRejected and log to info', t => {
      let event = {}
      let transfer = { transferUuid: 'uuid' }

      TransferService.saveTransferRejected.withArgs(event).returns(P.resolve(transfer))

      Projection.handleTransferRejected(event)
      .then(result => {
        t.ok(TransferService.saveTransferRejected.calledWith(event))
        t.ok(Logger.info.calledWith('Saved TransferRejected event for transfer ' + transfer.transferUuid))
        t.end()
      })
    })

    rejectedTest.test('log error', t => {
      let error = new Error()
      let event = {}
      TransferService.saveTransferRejected.withArgs(event).returns(P.reject(error))

      Projection.handleTransferRejected(event)
      .then(() => {
        t.ok(Logger.error.calledWith('Error saving TransferRejected event', error))
        t.end()
      })
    })

    rejectedTest.end()
  })

  projectionTest.end()
})
