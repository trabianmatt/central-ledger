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
      auth: Auth.tokenAuth(),
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
    path: '/accounts',
    handler: Handler.getAll,
    config: {
      tags: tags,
      description: 'Retreive all accounts',
      auth: Auth.adminTokenAuth()
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
      auth: Auth.tokenAuth(),
      validate: {
        params: {
          name: nameValidator
        }
      }
    }
  }
]
