const Handler = require('./handler')
const Joi = require('joi')
const BaseHandler = require('../../lib/handler')

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
      description: 'Create an account.',
      validate: {
        payload: {
          name: nameValidator
        },
        failAction: BaseHandler.failAction
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
      validate: {
        params: {
          name: nameValidator
        },
        failAction: BaseHandler.failAction
      }
    }
  }
]
