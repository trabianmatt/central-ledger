'use strict'

const Base64Url = require('urlsafe-base64')
const Condition = require('./conditions').Condition
const PreimageSha256 = require('./types/preimage-sha256')
const ParseError = require('../errors/parse-error')
const ValidationError = require('../errors/validation-error')
const UnsupportedCryptoTypeError = require('../errors/unsupported-crypto-type-error')

function validateConditionFulfillment (conditionUri, fulfillmentUri) {
  let fulfillment = Fulfillment.fromUri(fulfillmentUri)

  let generatedConditionUri = fulfillment.generateConditionUri()
  if (conditionUri !== generatedConditionUri) {
    throw new ValidationError('Fulfillment does not match condition (expected: ' +
      conditionUri + ', actual: ' + generatedConditionUri + ')')
  }

  return fulfillment.validate()
}

function Fulfillment (fulfillmentType) {
  this._fulfillmentType = fulfillmentType
}

// We are only supporting type PREIMAGE-SHA-256
Fulfillment.SUPPORTED_TYPES = {
  0: PreimageSha256
}

Fulfillment.REGEX = /^cf:([1-9a-f][0-9a-f]{0,3}|0):[a-zA-Z0-9_-]*$/

Fulfillment.fromUri = function (fulfillmentUri) {
  if (typeof fulfillmentUri !== 'string') {
    throw new Error('Fulfillment uri must be a string')
  }

  if (!Fulfillment.REGEX.exec(fulfillmentUri)) {
    throw new ParseError('Invalid fulfillment format')
  }

  let pieces = fulfillmentUri.split(':')

  let typeId = parseInt(pieces[1], 16)
  let payload = Base64Url.decode(pieces[2])

  if (!(typeId in Fulfillment.SUPPORTED_TYPES)) {
    throw new UnsupportedCryptoTypeError('Type ' + typeId + ' is not supported')
  }

  let FulfillmentTypeClass = Fulfillment.SUPPORTED_TYPES[typeId]

  return new Fulfillment(new FulfillmentTypeClass(payload))
}

Fulfillment.prototype.getFulfillmentType = function () {
  return this._fulfillmentType
}

Fulfillment.prototype.generateConditionUri = function () {
  let fulfillmentType = this.getFulfillmentType()

  let condition = new Condition(
    fulfillmentType.getTypeId(),
    fulfillmentType.getBitmask(),
    fulfillmentType.generateFingerprint(),
    fulfillmentType.calculateMaxFulfillmentLength()
  )

  return condition.toUri()
}

Fulfillment.prototype.validate = function () {
  return this.getFulfillmentType().validate()
}

module.exports = {
  validateConditionFulfillment,
  Fulfillment
}
