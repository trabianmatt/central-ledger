'use strict'

const Db = require('../db')

const executedTransfersTable = 'executedTransfers'

exports.create = (transfer) => {
  return Db.connect()
    .then(db => db(executedTransfersTable).insert({ transferId: transfer.id }, '*')).then(inserted => inserted[0])
}

exports.truncate = () => {
  return Db.connect()
    .then(db => db(executedTransfersTable).truncate())
}
