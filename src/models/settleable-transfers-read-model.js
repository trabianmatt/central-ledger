'use strict'

const Db = require('../db')

exports.getSettleableTransfers = () => {
  return Db.connect().then(db => db.getSettleableTransfersAsync())
}

exports.getSettleableTransfersByAccount = (accountId) => {
  return Db.connect().then(db => db.getSettleableTransfersByAccountAsync(accountId))
}
