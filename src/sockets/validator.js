'use strict'

const Joi = require('joi')
const P = require('bluebird')
const ValidationError = require('@leveloneproject/central-services-shared').ValidationError
const AccountService = require('../domain/account')

const validationOptions = { abortEarly: false, language: { key: '{{!key}} ' } }
const requestSchema = Joi.object().keys({
  id: Joi.any().required(),
  jsonrpc: Joi.string().valid('2.0').required(),
  method: Joi.string().valid('subscribe_account').required(),
  params: Joi.object({
    accounts: Joi.array().items(Joi.string().uri()).required()
  }).unknown().required()
})

class InvalidSubscriptionRequestError extends ValidationError {
  constructor (...errors) {
    super('Invalid subscription request', errors)
  }
}

const reformatValidationError = (err) => {
  const details = err.details.map(d => ({ message: d.message, params: d.context }))
  return new InvalidSubscriptionRequestError(...details)
}

const validateSubscriptionRequest = (data, cb) => {
  try {
    const request = JSON.parse(data)
    return Joi.validate(request, requestSchema, validationOptions, (err, result) => {
      if (err) {
        return cb(reformatValidationError(err))
      }
      P.all(result.params.accounts.map(accountUri => AccountService.exists(accountUri)))
      .then(() => cb(null, { id: result.id, jsonrpc: result.jsonrpc, accountUris: result.params.accounts }))
      .catch(e => {
        cb(new InvalidSubscriptionRequestError({ message: e.message }))
      })
    })
  } catch (e) {
    return cb(new InvalidSubscriptionRequestError({ message: e.message }))
  }
}

module.exports = {
  validateSubscriptionRequest
}
