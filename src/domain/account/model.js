'use strict'

const Db = require('../../db')

exports.getById = (id) => {
  return Db.connect().then(db => db.accounts.findOneAsync({ accountId: id }))
}

exports.getByName = (name) => {
  return Db.connect().then(db => db.accounts.findOneAsync({ name: name }))
}

exports.getAll = () => {
  return Db.connect().then(db => db.accounts.findAsync({}, { order: 'name' }))
}

exports.create = (account) => {
  return Db.connect()
    .then(db => db.accounts.saveAsync(
      {
        name: account.name,
        key: account.key,
        secret: account.secret
      })
    )
}
