'use strict'

const AccountService = require('../../domain/account')
const Logger = require('@leveloneproject/central-services-shared').Logger

const validate = (request, name, password, cb) => {
  if (!password) {
    return cb(null, false)
  }
  return AccountService.verify(name, password)
    .then(account => cb(null, true, account))
    .catch(e => {
      Logger.error(e)
      return cb(null, false)
    })
}

module.exports = {
  name: 'account',
  scheme: 'basic',
  validate
}
