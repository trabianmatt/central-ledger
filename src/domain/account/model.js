'use strict'

const Db = require('../../db')

const accountsTable = 'accounts'
const userCredentialsTable = 'userCredentials'

exports.getById = (id) => {
  return Db.connect().then(db => db(accountsTable).where({ accountId: id }).first())
}

exports.getByName = (name) => {
  return Db.connect().then(db => db(accountsTable).where({ name: name }).first())
}

exports.retrieveUserCredentials = (account) => {
  return Db.connect().then(db => db(userCredentialsTable).where({ accountId: account.accountId }).first())
}

exports.getAll = () => {
  return Db.connect().then(db => db(accountsTable).orderBy('name', 'asc'))
}

exports.update = (account, isDisabled) => {
  return Db.connect()
  .then(db => db(accountsTable).where({ accountId: account.accountId }).update({ isDisabled: isDisabled }, '*'))
  .then(updated => updated[0])
}

exports.create = (account) => {
  return Db.connect()
    .then(db => {
      return db(accountsTable).insert({ name: account.name }, '*')
        .then(insertedAccount => {
          return db(userCredentialsTable).insert({ accountId: insertedAccount[0].accountId, password: account.hashedPassword }, '*')
            .then(() => insertedAccount[0])
        })
    })
}
