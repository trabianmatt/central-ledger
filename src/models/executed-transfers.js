'use strict'

const Db = require('../db')

exports.create = (transfer) => {
  return Db.executedTransfers().insert({ transferId: transfer.id }, '*').then(inserted => inserted[0])
}

exports.truncate = () => {
  return Db.executedTransfers().truncate()
}
