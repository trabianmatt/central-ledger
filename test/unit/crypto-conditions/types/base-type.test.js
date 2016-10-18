'use strict'

const Test = require('tape')
const BaseType = require('../../../../src/crypto-conditions/types/base-type')

Test('converts payload to buffer if not already a buffer', function (assert) {
  let payload = 'Test payload'

  let baseType = new BaseType(payload)

  assert.ok(Buffer.isBuffer(baseType.getPayload()))
  assert.end()
})

Test('throws not implemented error for methods to be overridden', function (assert) {
  let baseType = new BaseType(new Buffer('test'))
  assert.throws(() => baseType.generateFingerprint(), /Not implemented/)
  assert.throws(() => baseType.validate(), /Not implemented/)
  assert.throws(() => baseType.calculateMaxFulfillmentLength(), /Not implemented/)
  assert.end()
})
