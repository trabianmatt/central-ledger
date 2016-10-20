'use strict'

const Service = require('../services/transfer')
const Config = require('../lib/config')

let rejectExpired = () => {
  return Service.rejectExpired()
  .then(x => {
    console.info(`Rejected transfers: ${x}`)
    return x
  })
  .catch(e => {
    console.error('Error rejecting transfers', e)
  })
}

exports.rejectExpired = rejectExpired

exports.register = (server, options, next) => {
  if (Config.EXPIRES_TIMEOUT) {
    this.rejectExpired()
    setInterval(this.rejectExpired, Config.EXPIRES_TIMEOUT)
  }
  next()
}

exports.register.attributes = {
  name: 'worker'
}
