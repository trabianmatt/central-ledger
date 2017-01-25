const Handler = require('./handler')
const Auth = require('../auth')

const tags = ['api', 'accounts']

module.exports = [
  {
    method: 'GET',
    path: '/accounts',
    handler: Handler.getAll,
    config: {
      tags: tags,
      description: 'Retreive all accounts',
      auth: Auth.tokenAuth()
    }
  }
]
