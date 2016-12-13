const Handler = require('./handler')
const Joi = require('joi')
const Auth = require('../auth')

const tags = ['api', 'accounts']
const nameValidator = Joi.string().token().max(256).required().description('Name of the account')

module.exports = [
  {
    method: 'POST',
    path: '/accounts',
    handler: Handler.create,
    config: {
      id: 'accounts',
      tags: tags,
      auth: Auth.routeAuth(),
      description: 'Create an account.',
      validate: {
        payload: {
          name: nameValidator
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/accounts/{name}',
    handler: Handler.getByName,
    config: {
      id: 'account',
      tags: tags,
      description: 'Retrieve an accounts details by name',
      auth: Auth.routeAuth(),
      validate: {
        params: {
          name: nameValidator
        }
      }
    }
  }
]
