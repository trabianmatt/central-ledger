'use strict'

const Config = require('../../lib/config')
const AccountStrategy = require('./account')
const TokenStrategy = require('./token')

exports.register = (server, options, next) => {
  server.auth.strategy(AccountStrategy.name, AccountStrategy.scheme, { validate: AccountStrategy.validate })
  server.auth.strategy(TokenStrategy.name, TokenStrategy.scheme, { validate: TokenStrategy.validate })

  next()
}

exports.register.attributes = {
  name: 'auth'
}

exports.routeAuth = () => {
  return Config.ENABLE_TOKEN_AUTH ? TokenStrategy.name : false
}
