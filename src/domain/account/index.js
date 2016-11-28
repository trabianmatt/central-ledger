'use strict'

const P = require('bluebird')
const Model = require('../../models/accounts')
const ValidationError = require('../../errors/validation-error')
const UrlParser = require('../../lib/urlparser')

const exists = (accountUri) => {
  return new P((resolve, reject) => {
    UrlParser.nameFromAccountUri(accountUri, (err, result) => {
      if (err) reject(new ValidationError(`Invalid account URI: ${accountUri}`))
      resolve(result)
    })
  })
  .then(name => {
    return Model.getByName(name)
      .then(account => {
        if (account) return account
        throw new ValidationError(`Account ${name} not found`)
      })
  })
}

module.exports = {
  exists
}
