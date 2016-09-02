const Handler = require('./handler')
const Joi = require('joi')
const tags = ['api', 'subscriptions']

module.exports = [{
  method: 'GET',
  path: '/subscriptions/{id}',
  handler: Handler.getSubscriptionById,
  config: {
    tags: tags,
    description: 'Retrieve a subscription\'s details by id',
    validate: {
      params: {
        id: Joi.string().guid().required().description('Id of subscription to retrieve')
      }
    }
  }
},
{
  method: 'POST',
  path: '/subscriptions',
  handler: Handler.createSubscription,
  config: {
    tags: tags,
    description: 'Create a subscription to be notified of transfer events',
    validate: {
      payload: {
        url: Joi.string().trim().uri().max(512).required().description('Url to be notified at'),
        secret: Joi.string().trim().max(128).required().description('Secret that will be used to sign notification')
      }
    }
  }
}]
