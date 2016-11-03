'use strict'

const Db = require('../db')

exports.create = (transfer) => {
  return Db.connect()
    .then(db => db.runAsync(`INSERT INTO "settledTransfers" ("transferId", "settlementId") VALUES (uuid('${transfer.id}'), uuid('${transfer.settlementId}'))`)
    )
}

exports.truncate = () => {
  return Db.connect()
    .then(db => db.runAsync('TRUNCATE "settledTransfers"'))
}
