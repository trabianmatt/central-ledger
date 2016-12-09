'use strict'

const Db = require('../../db')

const create = ({ accountId, token }) => {
  return Db.connect().then(db => db.tokens.saveAsync({
    accountId,
    token
  }))
}

module.exports = {
  create
}
