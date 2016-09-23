const Handler = require('./handler')
const Joi = require('joi')

const tags = ['api', 'register']

module.exports = [{
  method: 'POST',
  path: '/register',
  handler: Handler.register,
  config: {
    tags: tags,
    description: 'Register to send transfers and receive notifications',
    validate: {
      payload: {
        identifier: Joi.string().trim().max(512).required().description('Unique value used to identify the registering party in subsequent calls'),
        name: Joi.string().trim().max(256).required().description('Name of registering party')
      }
    }
  }
}]
