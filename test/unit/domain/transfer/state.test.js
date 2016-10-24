'use strict'

const Test = require('tape')
const State = require('../../../../src/domain/transfer/state')

Test('State values', test => {
  test.equal(State.EXECUTED, 'executed')
  test.equal(State.PREPARED, 'prepared')
  test.equal(State.REJECTED, 'rejected')
  test.end()
})
