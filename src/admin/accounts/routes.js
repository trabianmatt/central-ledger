const Handler = require('./handler')
const Auth = require('../auth')
const Joi = require('joi')

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
  },
  {
    method: 'PUT',
    path: '/accounts/{name}',
    handler: Handler.update,
    config: {
      tags: tags,
      description: 'Update account',
      auth: Auth.tokenAuth(),
      validate: {
        payload: {
          is_disabled: Joi.boolean().required().description('Account is_disabled boolean')
        }
      }
    }
  }
]
