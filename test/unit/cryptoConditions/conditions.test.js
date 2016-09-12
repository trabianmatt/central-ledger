'use strict'

const Test = require('tape')
const Base64Url = require('urlsafe-base64')
const Conditions = require('../../../src/cryptoConditions/conditions')
const ParseError = require('../../../src/errors/parse-error')
const ValidationError = require('../../../src/errors/validation-error')
const UnsupportedCryptoTypeError = require('../../../src/errors/unsupported-crypto-type-error')

Test('throw error if condition uri is not a string', function (assert) {
  let invalidConditionUri = 1

  assert.throws(() => Conditions.Condition.fromUri(invalidConditionUri), /Condition uri must be a string/)

  assert.end()
})

Test('throw error if condition does not match regex', function (assert) {
  let invalidConditionUri = 'cc:0'

  assert.throws(() => Conditions.Condition.fromUri(invalidConditionUri), ParseError, /Invalid condition format/)
  assert.end()
})

Test('throw UnsupportedCryptoTypeError if type is not supported', function (assert) {
  let invalidConditionUri = 'cc:1:3:dB-8fb14MdO75Brp_Pvh4d7ganckilrRl13RS_UmrXA:66'

  assert.throws(() => Conditions.validateCondition(invalidConditionUri), UnsupportedCryptoTypeError, /Type 1 is not supported/)
  assert.end()
})

Test('throw ValidationError if bitmask too large', function (assert) {
  let invalidConditionUri = 'cc:0:fffffffff:dB-8fb14MdO75Brp_Pvh4d7ganckilrRl13RS_UmrXA:66'

  assert.throws(() => Conditions.validateCondition(invalidConditionUri), ValidationError, /Bitmask is too large to be safely supported/)
  assert.end()
})

Test('throw ValidationError if bitmask not supported', function (assert) {
  let invalidConditionUri = 'cc:0:5:dB-8fb14MdO75Brp_Pvh4d7ganckilrRl13RS_UmrXA:66'

  assert.throws(() => Conditions.validateCondition(invalidConditionUri), ValidationError, /Condition feature suites are not supported/)
  assert.end()
})

Test('throw ValidationError if max fulfillment length too large', function (assert) {
  let invalidConditionUri = 'cc:0:3:dB-8fb14MdO75Brp_Pvh4d7ganckilrRl13RS_UmrXA:65536'

  assert.throws(() => Conditions.validateCondition(invalidConditionUri), ValidationError, /Condition max fulfillment length is too large/)
  assert.end()
})

Test('passes validation successfully', function (assert) {
  let conditionUri = 'cc:0:3:dB-8fb14MdO75Brp_Pvh4d7ganckilrRl13RS_UmrXA:66'

  assert.ok(Conditions.validateCondition(conditionUri))
  assert.end()
})

Test('parses condition successfully', function (assert) {
  let conditionUri = 'cc:0:3:dB-8fb14MdO75Brp_Pvh4d7ganckilrRl13RS_UmrXA:66'

  let condition = Conditions.Condition.fromUri(conditionUri)

  assert.equal(condition.getTypeId(), 0x00)
  assert.equal(condition.getBitmask(), 0x03)
  assert.deepEqual(condition.getFingerprint(), Base64Url.decode('dB-8fb14MdO75Brp_Pvh4d7ganckilrRl13RS_UmrXA'))
  assert.equal(condition.getMaxFulfillmentLength(), 66)
  assert.end()
})

Test('serializes to uri', function (assert) {
  let conditionUri = 'cc:0:3:dB-8fb14MdO75Brp_Pvh4d7ganckilrRl13RS_UmrXA:66'
  let condition = Conditions.Condition.fromUri(conditionUri)

  assert.equal(condition.toUri(), conditionUri)
  assert.end()
})
