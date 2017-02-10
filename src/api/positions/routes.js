const Handler = require('./handler')
const Auth = require('../auth')
const tags = ['api', 'positions']

module.exports = [
  {
    method: 'GET',
    path: '/positions',
    handler: Handler.perform,
    config: {
      id: 'positions',
      auth: Auth.strategy(),
      tags: tags,
      description: 'Retrieve outstanding positions.'
    }
  }
]
