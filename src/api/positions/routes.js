const Handler = require('./handler')

const tags = ['api', 'positions']

module.exports = [
  {
    method: 'GET',
    path: '/positions',
    handler: Handler.perform,
    config: {
      id: 'positions',
      tags: tags,
      description: 'Retrieve outstanding positions.'
    }
  }
]
