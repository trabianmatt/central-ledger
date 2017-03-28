'use strict'

const TransferService = require('../../domain/transfer')
const FeeService = require('../../domain/fee')
const TokenService = require('../../domain/token')

exports.rejectExpired = function (request, reply) {
  return TransferService.rejectExpired()
    .then(response => reply(response))
    .catch(e => reply(e))
}

exports.settle = function (request, reply) {
  return TransferService.settle()
    .then(settledTransfers => {
      return FeeService.settleFeesForTransfers(settledTransfers)
        .then(settledFees => {
          return reply({ transfers: settledTransfers, fees: settledFees })
        })
    })
    .catch(e => reply(e))
}

exports.rejectExpiredTokens = function (request, reply) {
  return TokenService.removeExpired()
    .then(response => reply(response))
    .catch(e => reply(e))
}
