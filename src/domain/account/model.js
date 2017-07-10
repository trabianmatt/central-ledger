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

exports.updateUserCredentials = (account, hashedPassword) => {
  return Db.userCredentials.update({ accountId: account.accountId }, { password: hashedPassword })
}

exports.updateAccountSettlement = (account, settlement) => {
  return Db.accountsSettlement.findOne({ accountId: account.accountId })
    .then(accountSettlement => {
      if (accountSettlement) {
        return Db.accountsSettlement.update({ accountId: account.accountId }, { accountNumber: settlement.account_number, routingNumber: settlement.routing_number })
      }
      return Db.accountsSettlement.insert({ accountId: account.accountId, accountNumber: settlement.account_number, routingNumber: settlement.routing_number })
    })
}

exports.create = (account) => {
  return Db.accounts.insert({ name: account.name })
    .then(insertedAccount => {
      return Db.userCredentials.insert({ accountId: insertedAccount.accountId, password: account.hashedPassword })
        .then(() => insertedAccount)
    })
}
