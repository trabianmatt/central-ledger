'use strict'

const Logger = require('@leveloneproject/central-services-shared').Logger
const TransferService = require('../../services/transfer')

module.exports = {
  initialize (params, done) {
    return TransferService.truncateReadModel()
      .then(() => done())
      .catch(err => {
        Logger.error('Error truncating read model', err)
      })
  },

  handleTransferPrepared (event) {
    return TransferService.saveTransferPrepared(event)
      .catch(err => {
        Logger.error('Error handling TransferPrepared event', err)
      })
  },

  handleTransferExecuted (event) {
    return TransferService.saveTransferExecuted(event)
      .catch(err => {
        Logger.error('Error handling TransferExecuted event', err)
      })
  },

  handleTransferRejected (event) {
    return TransferService.saveTransferRejected(event)
      .catch(err => {
        Logger.error('Error handling TransferRejected event', err)
      })
  }
}
