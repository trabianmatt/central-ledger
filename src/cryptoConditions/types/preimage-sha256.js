'use strict'

const Util = require('util')
const Crypto = require('crypto')
const BaseType = require('./base-type')

function PreimageSha256 () {
  PreimageSha256.super_.apply(this, arguments)
}

Util.inherits(PreimageSha256, BaseType)

PreimageSha256.prototype.generateFingerprint = function () {
  return Crypto.createHash('sha256').update(this.getPayload()).digest()
}

PreimageSha256.prototype.calculateMaxFulfillmentLength = function () {
  return this.getPayload().length
}

PreimageSha256.prototype.validate = function () {
  return true
}

PreimageSha256.TYPE_ID = 0
PreimageSha256.BITMASK = 0x03

module.exports = PreimageSha256
