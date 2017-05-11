'use strict'

const TokenService = require('../../domain/token')

const create = (req, rep) => {
  TokenService.create(req.auth.credentials)
    .then(token => rep(token))
    .catch(e => rep(e))
}

module.exports = {
  create
}
