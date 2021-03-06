'use strict'

const P = require('bluebird')
const InvalidBodyError = require('@leveloneproject/central-services-error-handling').InvalidBodyError
const Config = require('../../lib/config')
const Accounts = require('../../domain/account')

const validate = (request) => {
  return new P((resolve, reject) => {
    const errors = []
    if (request.ledger !== Config.HOSTNAME) {
      errors.push({ message: 'ledger is not valid for this ledger', params: { key: 'ledger', value: request.ledger } })
    }

    P.all([
      Accounts.exists(request.to).catch(e => errors.push({ message: e.message, params: { key: 'to', value: request.to } })),
      Accounts.exists(request.from).catch(e => errors.push({ message: e.message, params: { key: 'from', value: request.from } }))
    ]).then(() => {
      if (errors.length > 0) {
        reject(new InvalidBodyError(...errors))
      } else {
        resolve(request)
      }
    })
  })
}

module.exports = {
  validate
}
