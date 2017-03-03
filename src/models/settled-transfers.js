'use strict'

const Db = require('../db')

exports.create = (transfer) => {
  return Db.settledTransfers().insert({ transferId: transfer.id, settlementId: transfer.settlementId }, '*').then(inserted => inserted[0])
}

exports.truncate = () => {
  return Db.settledTransfers().truncate()
}
