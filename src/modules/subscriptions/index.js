'use strict'

const handler = require('./handler')
const Joi = require('joi')

exports.register = function (server, options, next) {
  server.route({
    method: 'GET',
    path: '/subscriptions/{id}',
    handler: handler.getSubscriptionById,
    config: {
      description: 'Retrieve a subscription\'s details by id'
    }
  })

  server.route({
    method: 'POST',
    path: '/subscriptions',
    handler: handler.createSubscription,
    config: {
      description: 'Create a subscription to be notified of transfer events',
      validate: {
        payload: {
          url: Joi.string().required().description('Url to be notified at'),
          secret: Joi.string().required().description('Secret that will be used to sign notification')
        }
      }
    }
  })

  next()
}

exports.register.attributes = {
  name: 'subscriptions'
}
