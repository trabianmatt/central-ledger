'use strict'

const Db = require('../db')

exports.getSettleableTransfers = () => {
  return Db.connect().then(db => db.getSettleableTransfersAsync())
}
