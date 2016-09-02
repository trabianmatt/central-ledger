'use strict'

const Base64Url = require('urlsafe-base64')
const PreimageSha256 = require('./types/preimage-sha256')

function validateCondition (conditionUri) {
  let condition = Condition.fromUri(conditionUri)
  return condition.validate()
}

function Condition (typeId, bitmask, fingerprint, maxFulfillmentLength) {
  this._typeId = typeId
  this._bitmask = bitmask
  this._fingerprint = fingerprint
  this._maxFulfillmentLength = maxFulfillmentLength
}

// We are only supporting type PREIMAGE-SHA-256
Condition.SUPPORTED_TYPES = [PreimageSha256.TYPE_ID]

// We are only supporting 32-bit numbers for the bitmask
Condition.MAX_SAFE_BITMASK = 0xffffffff

// We are only supporting feature suite PREIMAGE-SHA-256 (0x01 | 0x02)
Condition.SUPPORTED_BITMASK = PreimageSha256.BITMASK

// We are only supporting fulfillments of length up to 65535
Condition.MAX_FULFILLMENT_LENGTH = 65535

Condition.REGEX = /^cc:([1-9a-f][0-9a-f]{0,3}|0):[1-9a-f][0-9a-f]{0,15}:[a-zA-Z0-9_-]{0,86}:([1-9][0-9]{0,17}|0)$/

Condition.fromUri = function (conditionUri) {
  if (typeof conditionUri !== 'string') {
    throw new Error('Condition uri must be a string')
  }

  if (!Condition.REGEX.exec(conditionUri)) {
    throw new Error('Invalid condition format')
  }

  let pieces = conditionUri.split(':')

  let typeId = parseInt(pieces[1], 16)
  let bitmask = parseInt(pieces[2], 16)
  let fingerprint = Base64Url.decode(pieces[3])
  let maxFulfillmentLength = parseInt(pieces[4], 10)

  return new Condition(typeId, bitmask, fingerprint, maxFulfillmentLength)
}

Condition.prototype.getTypeId = function () {
  return this._typeId
}

Condition.prototype.getBitmask = function () {
  return this._bitmask
}

Condition.prototype.getFingerprint = function () {
  return this._fingerprint
}

Condition.prototype.getMaxFulfillmentLength = function () {
  return this._maxFulfillmentLength
}

Condition.prototype.toUri = function () {
  return 'cc' +
    ':' + this.getTypeId().toString(16) +
    ':' + this.getBitmask().toString(16) +
    ':' + Base64Url.encode(this.getFingerprint()) +
    ':' + this.getMaxFulfillmentLength()
}

Condition.prototype.validate = function () {
  if (!(this._typeId in Condition.SUPPORTED_TYPES)) {
    throw new Error('Type ' + this._typeId + ' is not supported')
  }

  if (this._bitmask > Condition.MAX_SAFE_BITMASK) {
    throw new Error('Bitmask is too large to be safely supported')
  }

  if (this._bitmask & ~Condition.SUPPORTED_BITMASK) {
    throw new Error('Condition feature suites are not supported')
  }

  if (this._maxFulfillmentLength > Condition.MAX_FULFILLMENT_LENGTH) {
    throw new Error('Condition max fulfillment length is too large')
  }

  return true
}

module.exports = {
  validateCondition,
  Condition
}
