'use strict'

const TransferService = require('../../domain/transfer')
const FeeService = require('../../domain/fee')
const TokenService = require('../../domain/token')
const Logger = require('../../lib/logger')

exports.rejectExpired = function (request, reply) {
  Logger.info('Webhooks.rejectExpired Request: %s', request)
  return TransferService.rejectExpired()
    .then(response => reply(response))
    .catch(e => reply(e))
}

exports.settle = function (request, reply) {
  Logger.info('Webhooks.settle Request: %s', request)
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
  Logger.info('Webhooks.rejectExpiredTokens Request: %s', request)
  return TokenService.removeExpired()
    .then(response => reply(response))
    .catch(e => reply(e))
}
