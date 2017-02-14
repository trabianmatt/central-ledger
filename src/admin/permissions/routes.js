'use strict'

const Handler = require('./handler')
const tags = ['api', 'permissions']

module.exports = [
  {
    method: 'GET',
    path: '/permissions',
    handler: Handler.getPermissions,
    config: {
      tags,
      description: 'Available permissions'
    }
  }
]
