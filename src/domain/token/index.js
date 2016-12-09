'use strict'

const Crypto = require('../../lib/crypto')
const Model = require('./model')

const hashToken = (token) => {
  return Crypto.hash(token).then(tokenHash => ({ token, tokenHash }))
}

const generateToken = () => {
  return Crypto.generateToken().then(hashToken)
}

const create = ({ accountId }) => {
  return generateToken().then(result => {
    return Model.create({ accountId, token: result.tokenHash })
      .then(() => ({ token: result.token }))
  })
}

module.exports = {
  create
}
