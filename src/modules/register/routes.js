const Handler = require('./handler')
// const Joi = require('joi')

const tags = ['api', 'subscriptions']

module.exports = [{
  method: 'POST',
  path: '/register',
  handler: Handler.register,
  config: {
    tags: tags,
    description: 'Register to send transfers and receive notifications'
  }
}]
