'use strict'

const Test = require('tape')
const RejectionType = require('../../../../src/domain/transfer/rejection-type')

Test('Rejection Type values', test => {
  test.equal(RejectionType.EXPIRED, 'Expired')
  test.equal(Object.keys(RejectionType).length, 1)
  test.end()
})
