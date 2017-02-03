'use strict'

const Db = require('../../db')

exports.getById = (id) => {
  return Db.connect().then(db => db.accounts.findOneAsync({ accountId: id }))
}

exports.getByName = (name) => {
  return Db.connect().then(db => db.accounts.findOneAsync({ name: name }))
}

exports.retrieveUserCredentials = (account) => {
  return Db.connect().then(db => db.userCredentials.findOneAsync({ accountId: account.accountId }))
}

exports.getAll = () => {
  return Db.connect().then(db => db.accounts.findAsync({}, { order: 'name' }))
}

exports.update = (account, isDisabled) => {
  return Db.connect().then(db => db.accounts.saveAsync(
    {
      accountId: account.accountId,
      isDisabled: isDisabled
    }
  ))
}

exports.create = (account) => {
  return Db.connect()
    .then(db => {
      return db.accounts.saveAsync(
        {
          name: account.name
        })
      .then(inserted => db.userCredentials.saveAsync(
        {
          accountId: inserted.accountId,
          password: account.hashedPassword
        }
      ).then(() => inserted))
    })
}
