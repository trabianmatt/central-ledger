const Handler = require('./handler')
const Auth = require('../auth')
const Joi = require('joi')

const tags = ['api', 'charges']

module.exports = [
  {
    method: 'GET',
    path: '/charges',
    handler: Handler.getAll,
    config: {
      tags: tags,
      description: 'Retrieve all charges',
      auth: Auth.tokenAuth()
    }
  },
  {
    method: 'POST',
    path: '/charges',
    handler: Handler.create,
    config: {
      tags: tags,
      description: 'Create charge',
      auth: Auth.tokenAuth(),
      validate: {
        payload: {
          name: Joi.string().token().max(256).required().description('Name of the charge'),
          charge_type: Joi.string().token().max(256).required().description('Type of the charge'),
          rate_type: Joi.string().token().max(256).required().description('Rate type of the charge'),
          rate: Joi.number().required().description('Rate for the charge'),
          minimum: Joi.number().optional().description('Minimum amount for the charge'),
          maximum: Joi.number().optional().description('Maximum amount for the charge'),
          code: Joi.number().required().description('Code for the charger'),
          is_active: Joi.boolean().required().description('Status for charge')
        }
      }
    }
  }
]
