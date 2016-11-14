'use strict'

const Handler = require('./handler')
const tags = ['api', 'commands']

module.exports = [
  {
    method: 'POST',
    path: '/webhooks/reject-expired-transfers',
    handler: Handler.rejectExpired,
    config: {
      tags: tags,
      description: 'Reject expired transfers'
    }
  },
  {
    method: 'POST',
    path: '/webhooks/settle-transfers',
    handler: Handler.settle,
    config: {
      tags: tags,
      description: 'Settle fulfilled transfers'
    }
  }
]
