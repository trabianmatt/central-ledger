const Handler = require('./handler')
const Joi = require('joi')
const Permissions = require('../../domain/security/permissions')
const RouteConfig = require('../route-config')

const tags = ['api', 'accounts']

module.exports = [
  {
    method: 'GET',
    path: '/accounts',
    handler: Handler.getAll,
    config: RouteConfig.config(tags, Permissions.ACCOUNTS_LIST)
  },
  {
    method: 'PUT',
    path: '/accounts/{name}',
    handler: Handler.update,
    config: RouteConfig.config(tags, Permissions.ACCOUNTS_UPDATE, {
      params: {
        name: Joi.string().required().description('Account name')
      },
      payload: {
        is_disabled: Joi.boolean().required().description('Account is_disabled boolean')
      }
    })
  }
]
