'use strict'

const P = require('bluebird')
const UnauthorizedError = require('@leveloneproject/central-services-auth').UnauthorizedError
const AccountService = require('../../domain/account')
const TokenService = require('../../domain/token')
const Crypto = require('../../lib/crypto')

const validate = (request, token, cb) => {
  const headers = request.headers
  const apiKey = headers['Ledger-Api-Key']

  if (!apiKey) {
    return cb(new UnauthorizedError('"Ledger-Api-Key" header is required'))
  }

  AccountService.getByKey(apiKey)
    .then(account => {
      if (!account) {
        return cb(new UnauthorizedError('"Ledger-Api-Key" header is not valid'))
      }
      return TokenService.byAccount(account).then(results => {
        if (!results || results.length === 0) {
          return cb(null, false)
        }

        return P.all(results.map(x => Crypto.verifyHash(x.token, token)))
        .then((verifications) => verifications.some(x => x))
        .then(verified => cb(null, verified, account))
      })
    })
}

module.exports = {
  name: 'token',
  scheme: 'bearer',
  validate
}
