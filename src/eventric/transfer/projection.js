'use strict'

const Logger = require('../../lib/logger')
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
      .then(transfer => {
        Logger.info('Saved TransferPrepared event for transfer ' + transfer.transferUuid)
      })
      .catch(err => {
        Logger.error('Error saving TransferPrepared event', err)
      })
  },

  handleTransferExecuted (event) {
    return TransferService.saveTransferExecuted(event)
      .then(transfer => {
        Logger.info('Saved TransferExecuted event for transfer ' + transfer.transferUuid)
      })
      .catch(err => {
        Logger.error('Error saving TransferExecuted event', err)
      })
  },

  handleTransferRejected (event) {
    return TransferService.saveTransferRejected(event)
      .then(transfer => {
        Logger.info('Saved TransferRejected event for transfer ' + transfer.transferUuid)
      })
      .catch(err => {
        Logger.error('Error saving TransferRejected event', err)
      })
  }
}
