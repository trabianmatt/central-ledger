'use strict'

const Handler = require('./handler')
const AccountAuthStrategy = require('../auth/account')
const AdminAuthStrategy = require('../auth/admin')
const tags = ['api', 'token']

module.exports = [
  {
    method: 'GET',
    path: '/auth_token',
    handler: Handler.create,
    config: {
      tags,
      auth: AccountAuthStrategy.name,
      description: 'Get a token that can be used to authenticate future requests',
      id: 'auth_token'
    }
  },
  {
    method: 'GET',
    path: '/admin_token',
    handler: Handler.create,
    config: {
      tags,
      auth: AdminAuthStrategy.name,
      description: 'Get a token for admin authentication'
    }
  }
]
