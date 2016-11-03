'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Logger = require(`${src}/lib/logger`)
const TransferService = require(`${src}/services/transfer`)
const TransfersProjection = require(`${src}/eventric/transfer/transfers-projection`)

Test('Transfers-Projection', transfersProjectionTest => {
  let sandbox

  transfersProjectionTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(TransferService, 'truncateReadModel')
    sandbox.stub(TransferService, 'saveTransferPrepared')
    sandbox.stub(TransferService, 'saveTransferExecuted')
    sandbox.stub(TransferService, 'saveTransferRejected')
    sandbox.stub(Logger, 'error')
    t.end()
  })

  transfersProjectionTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  transfersProjectionTest.test('Initialize should', initTest => {
    initTest.test('truncate read model and call done', t => {
      TransferService.truncateReadModel.returns(P.resolve())

      let done = sandbox.stub()

      TransfersProjection.initialize({}, done)
      .then(result => {
        t.ok(done.calledOnce)
        t.end()
      })
    })

    initTest.test('log error thrown by truncateReadModel', t => {
      let error = new Error()
      TransferService.truncateReadModel.returns(P.reject(error))

      let done = sandbox.stub()

      TransfersProjection.initialize({}, done)
      .then(result => {
        t.notOk(done.called)
        t.ok(Logger.error.calledWith('Error truncating read model', error))
        t.end()
      })
    })

    initTest.end()
  })

  transfersProjectionTest.test('handleTransferPrepared should', preparedTest => {
    preparedTest.test('saveTransferPrepared', t => {
      let event = {}
      let transfer = { transferUuid: 'uuid' }

      TransferService.saveTransferPrepared.withArgs(event).returns(P.resolve(transfer))

      TransfersProjection.handleTransferPrepared(event)
      .then(result => {
        t.ok(TransferService.saveTransferPrepared.calledOnce)
        t.end()
      })
    })

    preparedTest.test('log error', t => {
      let error = new Error()
      let event = {}
      TransferService.saveTransferPrepared.withArgs(event).returns(P.reject(error))

      TransfersProjection.handleTransferPrepared(event)
      .then(() => {
        t.ok(Logger.error.calledWith('Error handling TransferPrepared event', error))
        t.end()
      })
    })

    preparedTest.end()
  })

  transfersProjectionTest.test('handleTransferExecuted should', executedTest => {
    executedTest.test('saveTransferExecuted', t => {
      let event = { aggregate: { id: 'uuid' } }
      let transfer = { transferUuid: 'uuid' }

      TransferService.saveTransferExecuted.withArgs(event).returns(P.resolve(transfer))

      TransfersProjection.handleTransferExecuted(event)
      .then(result => {
        t.ok(TransferService.saveTransferExecuted.calledOnce)
        t.end()
      })
    })

    executedTest.test('log error', t => {
      let error = new Error()
      let event = {}
      TransferService.saveTransferExecuted.withArgs(event).returns(P.reject(error))

      TransfersProjection.handleTransferExecuted(event)
      .then(() => {
        t.ok(Logger.error.calledWith('Error handling TransferExecuted event', error))
        t.end()
      })
    })

    executedTest.end()
  })

  transfersProjectionTest.test('handleTransferRejected should', rejectedTest => {
    rejectedTest.test('saveTransferRejected', t => {
      let event = {}
      let transfer = { transferUuid: 'uuid' }

      TransferService.saveTransferRejected.withArgs(event).returns(P.resolve(transfer))

      TransfersProjection.handleTransferRejected(event)
      .then(result => {
        t.ok(TransferService.saveTransferRejected.calledWith(event))
        t.end()
      })
    })

    rejectedTest.test('log error', t => {
      let error = new Error()
      let event = {}
      TransferService.saveTransferRejected.withArgs(event).returns(P.reject(error))

      TransfersProjection.handleTransferRejected(event)
      .then(() => {
        t.ok(Logger.error.calledWith('Error handling TransferRejected event', error))
        t.end()
      })
    })

    rejectedTest.end()
  })

  transfersProjectionTest.end()
})
