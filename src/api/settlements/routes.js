const Handler = require('./handler')

const tags = ['api', 'settlements']

module.exports = [
  {
    method: 'POST',
    path: '/settlements',
    handler: Handler.perform,
    config: {
      id: 'settlements',
      tags: tags,
      description: 'Perform a settlement.'
    }
  }
]
