'use strict'

const Test = require('tapes')(require('tape'))
const Events = require('../../../../src/eventric/transfer/events')
const RejectionType = require('../../../../src/domain/transfer/rejection-type')

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
    rejectTest.test('Set rejection_reason and default rejection_type', t => {
      let rejectionReason = 'rejection reason'
      let result = Events.TransferRejected({ rejection_reason: rejectionReason })
      t.equal(result.rejection_reason, rejectionReason)
      t.equal(result.rejection_type, RejectionType.CANCELED)
      t.end()
    })

    rejectTest.test('Set rejection_reason and rejection_type', t => {
      let rejectionReason = 'rejection reason'
      let result = Events.TransferRejected({ rejection_reason: rejectionReason, rejection_type: RejectionType.EXPIRED })
      t.equal(result.rejection_reason, rejectionReason)
      t.equal(result.rejection_type, RejectionType.EXPIRED)
      t.end()
    })
    rejectTest.end()
  })
  eventsTest.end()
})
