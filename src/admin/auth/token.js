'use strict'

const TokenAuth = require('../../domain/token/auth')

module.exports = {
  name: 'admin-token',
  scheme: 'bearer',
  validate: TokenAuth.validate(true)
}

