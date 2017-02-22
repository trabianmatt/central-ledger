'use strict'

const Db = require('../../db')

exports.create = (fee) => {
  return Db.connect()
    .then(db => {
      return db.fees.saveAsync(

          fee
        )
    })
}

exports.getAllForTransfer = (transfer) => {
  return Db.connect().then(db => db.fees.findAsync({ transferId: transfer.transferUuid }, {}))
}

exports.doesExist = (charge, transfer) => {
  return Db.connect().then(db => db.fees.findAsync({ transferId: transfer.transferUuid, chargeId: charge.chargeId }, {}))
}
