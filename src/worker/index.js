'use strict'

const Logger = require('@leveloneproject/central-services-shared').Logger
const Service = require('../services/transfer')
const Config = require('../lib/config')

let rejectExpired = () => {
  return Service.rejectExpired()
  .then(x => {
    Logger.info(`Rejected transfers: ${x}`)
    return x
  })
  .catch(e => {
    Logger.error('Error rejecting transfers', e)
  })
}

exports.rejectExpired = rejectExpired

exports.register = (server, options, next) => {
  if (Config.EXPIRES_TIMEOUT) {
    setInterval(this.rejectExpired, Config.EXPIRES_TIMEOUT)
  }
  next()
}

exports.register.attributes = {
  name: 'worker'
}
