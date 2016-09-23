const Handler = require('./handler')
const Joi = require('joi')
const tags = ['api', 'transfers']

module.exports = [{
  method: 'PUT',
  path: '/transfers/{id}',
  handler: Handler.prepareTransfer,
  config: {
    id: 'transfer',
    tags: tags,
    description: 'Prepare a transfer',
    validate: {
      params: {
        id: Joi.string().guid().required().description('Id of transfer to prepare')
      },
      payload: {
        id: Joi.string().uri().required().description('Id of transfer'),
        ledger: Joi.string().uri().required().description('Ledger of transfer'),
        debits: Joi.array().items(Joi.object().keys({
          account: Joi.string().uri().required().description('Debit account of the transfer'),
          amount: Joi.number().required().description('Debit amount of the transfer')
        })).required().description('Debits of the transfer'),
        credits: Joi.array().items(Joi.object().keys({
          account: Joi.string().uri().required().description('Credit account of the transfer'),
          amount: Joi.number().required().description('Credit amount of the transfer')
        })).required().description('Credits of the transfer'),
        execution_condition: Joi.string().trim().max(65535).required().description('Execution condition of transfer'),
        expires_at: Joi.string().isoDate().required().description('When the transfer expires')
      }
    }
  }
},
{
  method: 'PUT',
  path: '/transfers/{id}/fulfillment',
  handler: Handler.fulfillTransfer,
  config: {
    id: 'transfer_fulfillment',
    tags: tags,
    description: 'Fulfill a transfer',
    validate: {
      params: {
        id: Joi.string().guid().required().description('Id of transfer to fulfill')
      },
      payload: Joi.string().trim().max(65535).required().description('Fulfillment of the execution condition')
    }
  }
}]
