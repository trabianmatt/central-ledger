'use strict'

const Handler = require('./handler')
const AdminAuthStrategy = require('../auth/admin')
const tags = ['api', 'token']

module.exports = [
  {
    method: 'GET',
    path: '/auth_token',
    handler: Handler.create,
    config: {
      tags,
      auth: AdminAuthStrategy.name,
      description: 'Get a token for admin authentication'
    }
  }
]
