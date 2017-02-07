'use strict'

const Test = require('tape')
const Util = require('../../../src/lib/util')

Test('util', utilTest => {
  utilTest.test('formatAmount should', formatAmountTest => {
    formatAmountTest.test('format integer', test => {
      const value = parseInt('100')
      test.equal(Util.formatAmount(value), '100.00')
      test.end()
    })

    formatAmountTest.test('format decimal', test => {
      const value = parseFloat('100.01')
      test.equal(Util.formatAmount(value), '100.01')
      test.end()
    })

    formatAmountTest.test('format string', test => {
      const value = '5.1'
      test.equal(Util.formatAmount(value), '5.10')
      test.end()
    })
    formatAmountTest.end()
  })
  utilTest.end()
})
