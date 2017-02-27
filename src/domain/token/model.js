'use strict'

const Db = require('../../db')
const Time = require('../../lib/time')

const tokensTable = 'tokens'

const create = ({ accountId, token, expiration }) => {
  return Db.connect().then(db => db(tokensTable).insert({
    accountId,
    token,
    expiration
  }, '*'))
  .then(inserted => inserted[0])
}

const byAccount = ({ accountId }) => {
  return Db.connect().then(db => db(tokensTable).where({ accountId: accountId }))
}

const removeExpired = () => {
  return Db.connect().then(db => db(tokensTable).where('expiration', '<=', Time.getCurrentUTCTimeInMilliseconds()).del('*'))
}

module.exports = {
  create,
  byAccount,
  removeExpired
}
