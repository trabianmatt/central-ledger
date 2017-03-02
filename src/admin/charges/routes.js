const Handler = require('./handler')
const Joi = require('joi')
const Permissions = require('../../domain/security/permissions')
const RouteConfig = require('../route-config')
const tags = ['api', 'charges']

module.exports = [
  {
    method: 'GET',
    path: '/charges',
    handler: Handler.getAll,
    config: RouteConfig.config(tags, Permissions.CHARGES_LIST)
  },
  {
    method: 'POST',
    path: '/charges',
    handler: Handler.create,
    config: RouteConfig.config(tags, Permissions.CHARGES_CREATE, {
      payload: {
        name: Joi.string().token().max(256).required().description('Name of the charge'),
        charge_type: Joi.string().required().valid('tax', 'fee').description('Type of the charge'),
        rate_type: Joi.string().required().valid('percent', 'flat').description('Rate type of the charge'),
        rate: Joi.number().required().description('Rate for the charge'),
        minimum: Joi.number().optional().description('Minimum amount for the charge'),
        maximum: Joi.number().optional().description('Maximum amount for the charge'),
        code: Joi.string().token().max(256).required().description('Code for the charger'),
        is_active: Joi.boolean().required().description('Status for charge'),
        payer: Joi.string().required().valid('sender', 'receiver', 'ledger').description('Payer of the charged fee'),
        payee: Joi.string().required().valid('sender', 'receiver', 'ledger').description('Payee of the charged fee')
      }
    })
  }
]
