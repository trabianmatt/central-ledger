'use strict'

const Test = require('tape')
const Conditions = require('../../src/lib/conditions')
const Base64Url = require('base64-url')

Test('throw error if condition uri is not a string', function (assert) {
  let invalidConditionUri = 1

  assert.throws(() => Conditions.Condition.fromUri(invalidConditionUri), /Condition uri must be a string/)

  assert.end()
})

Test('throw error if condition does not match regex', function (assert) {
  let invalidConditionUri = 'cc:0'

  assert.throws(() => Conditions.Condition.fromUri(invalidConditionUri), /Invalid condition format/)

  assert.end()
})

Test('throw error if type is not supported', function (assert) {
  let invalidConditionUri = 'cc:1:3:dB-8fb14MdO75Brp_Pvh4d7ganckilrRl13RS_UmrXA:66'

  assert.throws(() => Conditions.validateCondition(invalidConditionUri), /Type 1 is not supported/)

  assert.end()
})

Test('throw error if bitmask too large', function (assert) {
  let invalidConditionUri = 'cc:0:fffffffff:dB-8fb14MdO75Brp_Pvh4d7ganckilrRl13RS_UmrXA:66'

  assert.throws(() => Conditions.validateCondition(invalidConditionUri), /Bitmask is too large to be safely supported/)

  assert.end()
})

Test('throw error if bitmask not supported', function (assert) {
  let invalidConditionUri = 'cc:0:5:dB-8fb14MdO75Brp_Pvh4d7ganckilrRl13RS_UmrXA:66'

  assert.throws(() => Conditions.validateCondition(invalidConditionUri), /Condition feature suites are not supported/)

  assert.end()
})

Test('throw error if max fulfillment length too large', function (assert) {
  let invalidConditionUri = 'cc:0:3:dB-8fb14MdO75Brp_Pvh4d7ganckilrRl13RS_UmrXA:65536'

  assert.throws(() => Conditions.validateCondition(invalidConditionUri), /Condition max fulfillment length is too large/)

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
  assert.equal(condition.getFingerprint(), Base64Url.decode('dB-8fb14MdO75Brp_Pvh4d7ganckilrRl13RS_UmrXA'))
  assert.equal(condition.getMaxFulfillmentLength(), 66)

  assert.end()
})
