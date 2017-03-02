'use strict'

const Db = require('../../db')

const accountsTable = 'accounts'
const userCredentialsTable = 'userCredentials'

exports.getById = (id) => {
  return Db.connection(accountsTable).where({ accountId: id }).first()
}

exports.getByName = (name) => {
  return Db.connection(accountsTable).where({ name: name }).first()
}

exports.retrieveUserCredentials = (account) => {
  return Db.connection(userCredentialsTable).where({ accountId: account.accountId }).first()
}

exports.getAll = () => {
  return Db.connection(accountsTable).orderBy('name', 'asc')
}

exports.update = (account, isDisabled) => {
  return Db.connection(accountsTable).where({ accountId: account.accountId }).update({ isDisabled: isDisabled }, '*')
    .then(updated => updated[0])
}

exports.create = (account) => {
  return Db.connection(accountsTable).insert({ name: account.name }, '*')
    .then(insertedAccount => {
      return Db.connection(userCredentialsTable).insert({ accountId: insertedAccount[0].accountId, password: account.hashedPassword }, '*')
        .then(() => insertedAccount[0])
    })
}
