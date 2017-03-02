'use strict'

const Db = require('../db')

const executedTransfersTable = 'executedTransfers'

exports.create = (transfer) => {
  return Db.connection(executedTransfersTable).insert({ transferId: transfer.id }, '*').then(inserted => inserted[0])
}

exports.truncate = () => {
  return Db.connection(executedTransfersTable).truncate()
}
