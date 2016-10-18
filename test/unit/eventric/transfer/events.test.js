'use strict'

const Test = require('tapes')(require('tape'))
const Events = require('../../../../src/eventric/transfer/events')

Test('Events Test', eventsTest => {
  eventsTest.test('TranserExcecuted should', executedTest => {
    executedTest.test('Set fulfillment', t => {
      let fulfillment = 'fulfillment'
      let result = Events.TransferExecuted({ fulfillment: fulfillment })
      t.equal(result.fulfillment, fulfillment)
      t.end()
    })
    executedTest.end()
  })

  eventsTest.test('TransferRejected should', rejectTest => {
    rejectTest.test('Set rejection_reason and account', t => {
      let rejectionReason = 'rejection reason'
      let result = Events.TransferRejected({ rejection_reason: rejectionReason })
      t.equal(result.rejection_reason, rejectionReason)
      t.end()
    })
    rejectTest.end()
  })
  eventsTest.end()
})
