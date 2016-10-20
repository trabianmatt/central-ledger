'use strict'

const TransfersReadModel = require('../../models/transfers-read-model')

module.exports = {
  initialize (params, done) {
    return TransfersReadModel.truncateReadModel()
      .then(() => done())
      .catch(err => {
        console.error('Error truncating read model', err)
      })
  },

  handleTransferPrepared (event) {
    return TransfersReadModel.saveTransferPrepared(event)
      .then(transfer => {
        console.info('Saved TransferPrepared event for transfer ' + transfer.transferUuid)
      })
      .catch(err => {
        console.error('Error saving TransferPrepared event', err)
      })
  },

  handleTransferExecuted (event) {
    return TransfersReadModel.saveTransferExecuted(event)
      .then(transfer => {
        console.info('Saved TransferExecuted event for transfer ' + transfer.transferUuid)
      })
      .catch(err => {
        console.error('Error saving TransferExecuted event', err)
      })
  },

  handleTransferRejected (event) {
    return TransfersReadModel.saveTransferRejected(event)
      .then(transfer => {
        console.info('Saved TransferRejected event for transfer ' + transfer.transferUuid)
      })
      .catch(err => {
        console.error('Error saving TransferRejected event', err)
      })
  }
}
