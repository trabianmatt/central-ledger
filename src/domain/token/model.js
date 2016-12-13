'use strict'

const Db = require('../../db')

const create = ({ accountId, token }) => {
  return Db.connect().then(db => db.tokens.saveAsync({
    accountId,
    token
  }))
}

const byAccount = ({ accountId }) => {
  return Db.connect().then(db => db.tokens.findAsync({ accountId }))
}

module.exports = {
  create,
  byAccount
}
