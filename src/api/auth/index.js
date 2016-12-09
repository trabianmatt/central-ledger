'use strict'

const AccountStrategy = require('./account')

exports.register = (server, options, next) => {
  server.auth.strategy(AccountStrategy.name, AccountStrategy.scheme, { validate: AccountStrategy.validate })
  next()
}

exports.register.attributes = {
  name: 'auth'
}
