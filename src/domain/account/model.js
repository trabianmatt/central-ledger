'use strict'

const Db = require('../../db')

exports.getById = (id) => {
  return Db.accounts.findOne({ accountId: id })
}

exports.getByName = (name) => {
  return Db.accounts.findOne({ name })
}

exports.retrieveUserCredentials = (account) => {
  return Db.userCredentials.findOne({ accountId: account.accountId })
}

exports.getAll = () => {
  return Db.accounts.find({}, { order: 'name asc' })
}

exports.update = (account, isDisabled) => {
  return Db.accounts.update({ accountId: account.accountId }, { isDisabled })
}

exports.create = (account) => {
  return Db.accounts.insert({ name: account.name })
    .then(insertedAccount => {
      return Db.userCredentials.insert({ accountId: insertedAccount.accountId, password: account.hashedPassword })
        .then(() => insertedAccount)
    })
}
