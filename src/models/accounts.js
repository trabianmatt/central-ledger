'use strict'

const Db = require('../db')

exports.getByName = name => {
  return Db.connect().then(db => db.accounts.findOneAsync({ name: name }))
}

exports.create = (account) => {
  return Db.connect()
    .then(db => db.accounts.saveAsync(
      {
        name: account.name
      })
    )
}
