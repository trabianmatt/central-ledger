'use strict'

const UrlParser = require('../lib/urlparser')

exports.toTransfer = (t) => {
  if (t.id) return fromTransferAggregate(t)
  else if (t.transferUuid) return fromTransferReadModel(t)
  else throw new Error(`Unable to translate to transfer: ${t}`)
}

let fromTransferAggregate = (t) => ({
  id: t.id,
  ledger: t.ledger,
  debits: t.debits,
  credits: t.credits,
  execution_condition: t.execution_condition,
  expires_at: t.expires_at,
  state: t.state,
  timeline: removeNullOrUndefinedTimelineProperties(t.timeline),
  rejection_reason: t.rejection_reason
})

let fromTransferReadModel = (t) => ({
  id: UrlParser.toTransferUri(t.transferUuid),
  ledger: t.ledger,
  debits: [{
    account: UrlParser.toAccountUri(t.debitAccountName),
    amount: t.debitAmount,
    invoice: t.debitInvoice,
    memo: t.debitMemo
  }],
  credits: [{
    account: UrlParser.toAccountUri(t.creditAccountName),
    amount: t.creditAmount,
    invoice: t.creditInvoice,
    memo: t.creditMemo
  }],
  execution_condition: t.executionCondition,
  expires_at: t.expiresAt,
  state: t.state,
  timeline: removeNullOrUndefinedTimelineProperties({
    prepared_at: t.preparedDate,
    executed_at: t.executedDate,
    rejected_at: t.rejectedDate
  }),
  rejection_reason: t.rejectionReason
})

const removeNullOrUndefinedTimelineProperties = (timeline) => {
  var newTimeline = {}
  if (timeline.prepared_at) newTimeline.prepared_at = timeline.prepared_at
  if (timeline.executed_at) newTimeline.executed_at = timeline.executed_at
  if (timeline.rejected_at) newTimeline.rejected_at = timeline.rejected_at

  return newTimeline
}
