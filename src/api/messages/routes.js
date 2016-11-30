'use strict'

const Joi = require('joi')
const Handler = require('./handler')
const tags = ['api', 'messages']

module.exports = [
  {
    method: 'POST',
    path: '/messages',
    handler: Handler.sendMessage,
    config: {
      tags,
      description: 'Send a notification to another account',
      id: 'send_message',
      validate: {
        payload: {
          ledger: Joi.string().uri().required(),
          from: Joi.string().required(),
          to: Joi.string().required(),
          data: Joi.object().required()
        }
      }
    }
  }
]