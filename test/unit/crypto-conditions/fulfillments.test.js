'use strict'

const Test = require('tape')
const Crypto = require('crypto')
const Base64Url = require('urlsafe-base64')
const Fulfillments = require('../../../src/crypto-conditions/fulfillments')
const BaseType = require('../../../src/crypto-conditions/types/base-type')
const PreimageSha256 = require('../../../src/crypto-conditions/types/preimage-sha256')
const ParseError = require('../../../src/errors/parse-error')
const ValidationError = require('../../../src/errors/validation-error')
const UnsupportedCryptoTypeError = require('../../../src/errors/unsupported-crypto-type-error')

Test('throw error if fulfillment uri is not a string', function (assert) {
  let invalidFulfillmentUri = 1

  assert.throws(() => Fulfillments.Fulfillment.fromUri(invalidFulfillmentUri), /Fulfillment uri must be a string/)
  assert.end()
})

Test('throw ParseError if fulfillment does not match regex', function (assert) {
  let invalidFulfillmentUri = 'cf:0'

  assert.throws(() => Fulfillments.Fulfillment.fromUri(invalidFulfillmentUri), ParseError, /Invalid fulfillment format/)
  assert.end()
})

Test('throw UnsupportedCryptoTypeError if type is not supported', function (assert) {
  let invalidFulfillmentUri = 'cf:1:VGhlIG9ubHkgYmFzaXMgZm9yIGdvb2QgU29jaWV0eSBpcyB1bmxpbWl0ZWQgY3JlZGl0LuKAlE9zY2FyIFdpbGRl'

  assert.throws(() => Fulfillments.Fulfillment.fromUri(invalidFulfillmentUri), UnsupportedCryptoTypeError, /Type 1 is not supported/)
  assert.end()
})

Test('parses PreimageSha256 fulfillment successfully', function (assert) {
  let fulfillmentUri = 'cf:0:VGhlIG9ubHkgYmFzaXMgZm9yIGdvb2QgU29jaWV0eSBpcyB1bmxpbWl0ZWQgY3JlZGl0LuKAlE9zY2FyIFdpbGRl'

  let fulfillment = Fulfillments.Fulfillment.fromUri(fulfillmentUri)
  let fulfillmentType = fulfillment.getFulfillmentType()

  assert.equal(typeof fulfillmentType, 'object')
  assert.ok(fulfillmentType instanceof BaseType)
  assert.equal(fulfillmentType.constructor.name, 'PreimageSha256')
  assert.equal(fulfillmentType.getTypeId(), PreimageSha256.TYPE_ID)
  assert.equal(fulfillmentType.getBitmask(), PreimageSha256.BITMASK)
  assert.deepEqual(fulfillmentType.getPayload(), new Buffer('The only basis for good Society is unlimited credit.—Oscar Wilde'))
  assert.end()
})

Test('generates matching PreimageSha256 condition uri', function (assert) {
  let conditionUri = 'cc:0:3:dB-8fb14MdO75Brp_Pvh4d7ganckilrRl13RS_UmrXA:66'
  let fulfillmentUri = 'cf:0:VGhlIG9ubHkgYmFzaXMgZm9yIGdvb2QgU29jaWV0eSBpcyB1bmxpbWl0ZWQgY3JlZGl0LuKAlE9zY2FyIFdpbGRl'

  let fulfillment = Fulfillments.Fulfillment.fromUri(fulfillmentUri)

  assert.equal(fulfillment.generateConditionUri(), conditionUri)
  assert.end()
})

Test('validates PreimageSha256 fulfillment against condition', function (assert) {
  let conditionUri = 'cc:0:3:dB-8fb14MdO75Brp_Pvh4d7ganckilrRl13RS_UmrXA:66'
  let fulfillmentUri = 'cf:0:VGhlIG9ubHkgYmFzaXMgZm9yIGdvb2QgU29jaWV0eSBpcyB1bmxpbWl0ZWQgY3JlZGl0LuKAlE9zY2FyIFdpbGRl'

  assert.ok(Fulfillments.validateConditionFulfillment(conditionUri, fulfillmentUri))
  assert.end()
})

Test('throws ValidationError on non-matching hash in PreimageSha256 fulfillment', function (assert) {
  let conditionUri = 'cc:0:3:dB-8fb14MdO75Brp_Pvh4d7ganckilrRl13RS_UmrXA:66'
  let fulfillmentUri = 'cf:0:' + Base64Url.encode(generateSha256Hash('This hash is different'))

  let fulfillment = Fulfillments.Fulfillment.fromUri(fulfillmentUri)

  assert.throws(() => Fulfillments.validateConditionFulfillment(conditionUri, fulfillmentUri), ValidationError, new RegExp('Fulfillment does not match condition \\(expected: ' + conditionUri + ', actual: ' + fulfillment.generateConditionUri() + '\\)'))
  assert.end()
})

function generateSha256Hash (text) {
  return Crypto.createHash('sha256').update(new Buffer(text)).digest()
}
