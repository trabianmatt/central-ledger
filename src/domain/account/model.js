'use strict'

const Db = require('../../db')

exports.getById = (id) => {
  return Db.accounts().where({ accountId: id }).first()
}

exports.getByName = (name) => {
  return Db.accounts().where({ name: name }).first()
}

exports.retrieveUserCredentials = (account) => {
  return Db.userCredentials().where({ accountId: account.accountId }).first()
}

exports.getAll = () => {
  return Db.accounts().orderBy('name', 'asc')
}

exports.update = (account, isDisabled) => {
  return Db.accounts().where({ accountId: account.accountId }).update({ isDisabled: isDisabled }, '*')
    .then(updated => updated[0])
}

exports.create = (account) => {
  return Db.accounts().insert({ name: account.name }, '*')
    .then(insertedAccount => {
      return Db.userCredentials().insert({ accountId: insertedAccount[0].accountId, password: account.hashedPassword }, '*')
        .then(() => insertedAccount[0])
    })
}
