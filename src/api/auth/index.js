'use strict'

const Config = require('../../lib/config')
const AccountStrategy = require('./account')
const TokenStrategy = require('./token')
const AllTokenAuth = TokenStrategy.all
const AdminTokenAuth = TokenStrategy.adminOnly
const AdminStrategy = require('./admin')

exports.register = (server, options, next) => {
  server.auth.strategy(AccountStrategy.name, AccountStrategy.scheme, { validate: AccountStrategy.validate })
  server.auth.strategy(AllTokenAuth.name, AllTokenAuth.scheme, { validate: AllTokenAuth.validate })
  server.auth.strategy(AdminTokenAuth.name, AdminTokenAuth.scheme, { validate: AdminTokenAuth.validate })
  server.auth.strategy(AdminStrategy.name, AdminStrategy.scheme, { validate: AdminStrategy.validate })
  next()
}

exports.register.attributes = {
  name: 'auth'
}

exports.tokenAuth = () => {
  return Config.ENABLE_TOKEN_AUTH ? TokenStrategy.all.name : false
}

exports.adminTokenAuth = () => {
  return Config.ENABLE_TOKEN_AUTH ? TokenStrategy.adminOnly.name : false
}
