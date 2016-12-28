'use strict'

const TransferService = require('../../services/transfer')
const TokenService = require('../../domain/token')

exports.rejectExpired = function (request, reply) {
  return TransferService.rejectExpired()
  .then(response => reply(response))
  .catch(e => reply(e))
}

exports.settle = function (request, reply) {
  return TransferService.settle()
  .then(response => reply(response))
  .catch(e => reply(e))
}

exports.rejectExpiredTokens = function (request, reply) {
  return TokenService.removeExpired()
  .then(response => reply(response))
  .catch(e => reply(e))
}
