const Handler = require('./handler')
const Joi = require('joi')
const Auth = require('../auth')

const tags = ['api', 'accounts']
const nameValidator = Joi.string().token().max(256).required().description('Name of the account')
const passwordValidator = Joi.string().token().max(256).required().description('Password for the account')

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
          name: nameValidator,
          password: passwordValidator
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
      auth: Auth.tokenAuth(),
      validate: {
        params: {
          name: nameValidator
        }
      }
    }
  }
]
