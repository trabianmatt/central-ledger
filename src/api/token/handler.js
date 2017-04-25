'use strict'

const TokenService = require('../../domain/token')
const Logger = require('../../lib/logger')

const create = (req, rep) => {
  Logger.info('ApiTokens.create request: %s', req)
  TokenService.create(req.auth.credentials)
    .then(token => rep(token))
    .catch(e => rep(e))
}

module.exports = {
  create
}
