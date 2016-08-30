'use strict'

function BaseType (payload) {
  if (!Buffer.isBuffer(payload)) {
    payload = new Buffer(payload)
  }
  this._payload = payload
}

BaseType.prototype.getTypeId = function () {
  return this.constructor.TYPE_ID
}

BaseType.prototype.getBitmask = function () {
  return this.constructor.BITMASK
}

BaseType.prototype.getPayload = function () {
  return this._payload
}

BaseType.prototype.generateFingerprint = function () {
  throw new Error('Not implemented')
}

BaseType.prototype.calculateMaxFulfillmentLength = function () {
  throw new Error('Not implemented')
}

BaseType.prototype.validate = function () {
  throw new Error('Not implemented')
}

module.exports = BaseType
