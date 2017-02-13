'use strict'

const Handler = require('./handler')
const tags = ['api', 'security']

module.exports = [
  {
    method: 'GET',
    path: '/security/permissions',
    handler: Handler.getPermissions,
    config: {
      tags,
      description: 'Available permissions'
    }
  }
]
