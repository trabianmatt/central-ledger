'use strict'

const TransfersModel = require('../../api/transfers/model')

module.exports = {
  initialize (params, done) {
    TransfersModel.truncateReadModel()
      .then(() => done())
      .catch((err) => {
        console.log('Error truncating read model', err)
      })
  },

  handleTransferPrepared (event) {
    return TransfersModel.saveTransferPrepared(event)
      .then((transfer) => {
        console.log('Saved TransferPrepared event for transfer ' + transfer.transferUuid)
      })
      .catch((err) => {
        console.log('Error saving TransferPrepared event', err)
      })
  },

  handleTransferExecuted (event) {
    return TransfersModel.saveTransferExecuted(event)
      .then((transfer) => {
        console.log('Saved TransferExecuted event for transfer ' + transfer.transferUuid)
      })
      .catch((err) => {
        console.log('Error saving TransferExecuted event', err)
      })
  }
}
