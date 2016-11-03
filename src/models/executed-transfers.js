'use strict'

const Db = require('../db')

exports.create = (transfer) => {
  return Db.connect()
    .then(db => db.runAsync(`INSERT INTO "executedTransfers" ("transferId") VALUES (uuid('${transfer.id}'))`)
    )
}

exports.truncate = () => {
  return Db.connect()
    .then(db => db.runAsync('TRUNCATE "executedTransfers"'))
}
