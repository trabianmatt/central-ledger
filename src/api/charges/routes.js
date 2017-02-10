const Handler = require('./handler')
const Joi = require('joi')
const Auth = require('../auth')

const tags = ['api', 'charges']

module.exports = [
  {
    method: 'POST',
    path: '/charges/quote',
    handler: Handler.chargeQuote,
    config: {
      id: 'charges',
      tags: tags,
      auth: Auth.tokenAuth(),
      description: 'Quote a charge for a transaction amount',
      validate: {
        payload: {
          amount: Joi.number().required().description('Amount for charge quote')
        }
      }
    }
  }
]
