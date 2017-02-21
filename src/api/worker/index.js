'use strict'

const Logger = require('@leveloneproject/central-services-shared').Logger
const TransferService = require('../../domain/transfer')
const TokenService = require('../../domain/token')
const Config = require('../../lib/config')

const rejectExpiredTransfers = () => {
  return TransferService.rejectExpired()
  .then(x => {
    Logger.info(`Rejected transfers: ${x}`)
    return x
  })
  .catch(e => {
    Logger.error('Error rejecting transfers', e)
  })
}

const rejectExpiredTokens = () => {
  return TokenService.removeExpired()
  .then(x => {
    Logger.info(`Rejected tokens: ${x}`)
    return x
  })
  .catch(e => {
    Logger.error('Error rejecting tokens', e)
  })
}

exports.rejectExpiredTransfers = rejectExpiredTransfers

exports.rejectExpiredTokens = rejectExpiredTokens

exports.register = (server, options, next) => {
  if (Config.EXPIRES_TIMEOUT) {
    setInterval(this.rejectExpiredTransfers, Config.EXPIRES_TIMEOUT)
  }
  if (Config.TOKEN_EXPIRATION) {
    setInterval(this.rejectExpiredTokens, Config.TOKEN_EXPIRATION)
  }
  next()
}

exports.register.attributes = {
  name: 'worker'
}
