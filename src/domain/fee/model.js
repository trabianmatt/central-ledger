'use strict'

const Db = require('../../db')

const feesTable = 'fees'

exports.create = (fee) => {
  return Db.connect().then(db => db(feesTable).insert(fee, '*')).then(inserted => inserted[0])
}

exports.getAllForTransfer = (transfer) => {
  return Db.connect().then(db => db(feesTable).where({ transferId: transfer.transferUuid }))
}

exports.doesExist = (charge, transfer) => {
  return Db.connect().then(db => db(feesTable).where({ transferId: transfer.transferUuid, chargeId: charge.chargeId }).first())
}
