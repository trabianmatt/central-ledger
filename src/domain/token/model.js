'use strict'

const Db = require('../../db')
const Time = require('../../lib/time')

const create = ({ accountId, token, expiration }) => {
  return Db.connect().then(db => db.tokens.saveAsync({
    accountId,
    token,
    expiration
  }))
}

const byAccount = ({ accountId }) => {
  return Db.connect().then(db => db.tokens.findAsync({ accountId }))
}

const removeExpired = () => {
  return Db.connect().then(db => db.tokens.destroyAsync({'expiration <=': Time.getCurrentUTCTimeInMilliseconds()}))
}

module.exports = {
  create,
  byAccount,
  removeExpired
}
