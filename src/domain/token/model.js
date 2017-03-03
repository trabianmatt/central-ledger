'use strict'

const Db = require('../../db')
const Time = require('../../lib/time')

const create = ({ accountId, token, expiration }) => {
  return Db.tokens().insert({
    accountId,
    token,
    expiration
  }, '*')
  .then(inserted => inserted[0])
}

const byAccount = ({ accountId }) => {
  return Db.tokens().where({ accountId: accountId })
}

const removeExpired = () => {
  return Db.tokens().where('expiration', '<=', Time.getCurrentUTCTimeInMilliseconds()).del('*')
}

module.exports = {
  create,
  byAccount,
  removeExpired
}
