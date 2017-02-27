'use strict'

const Db = require('../db')

const settledTransfersTable = 'settledTransfers'

exports.create = (transfer) => {
  return Db.connect()
    .then(db => db(settledTransfersTable).insert({ transferId: transfer.id, settlementId: transfer.settlementId }, '*')).then(inserted => inserted[0])
}

exports.truncate = () => {
  return Db.connect()
    .then(db => db(settledTransfersTable).truncate())
}
