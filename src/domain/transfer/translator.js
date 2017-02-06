'use strict'

const UrlParser = require('../../lib/urlparser')
const Util = require('../../lib/util')

const eventricProperty = (value, key) => {
  return key.startsWith('$')
}

const fromTransferAggregate = (t) => Util.merge(Util.omitBy(t, eventricProperty), { id: UrlParser.toTransferUri(t.id), timeline: Util.omitNil(t.timeline) })

const fromTransferReadModel = (t) => ({
  id: UrlParser.toTransferUri(t.transferUuid),
  ledger: t.ledger,
  debits: [{
    account: UrlParser.toAccountUri(t.debitAccountName),
    amount: t.debitAmount,
    memo: t.debitMemo
  }],
  credits: [{
    account: UrlParser.toAccountUri(t.creditAccountName),
    amount: t.creditAmount,
    memo: t.creditMemo
  }],
  execution_condition: t.executionCondition,
  expires_at: t.expiresAt,
  state: t.state,
  timeline: Util.omitNil({
    prepared_at: t.preparedDate,
    executed_at: t.executedDate,
    rejected_at: t.rejectedDate
  }),
  rejection_reason: t.rejectionReason
})

const toTransfer = (t) => {
  if (t.id) {
    return fromTransferAggregate(t)
  } else if (t.transferUuid) {
    return fromTransferReadModel(t)
  } else throw new Error(`Unable to translate to transfer: ${t}`)
}

const fromPayload = (payload) => Util.merge(payload, { id: UrlParser.idFromTransferUri(payload.id) })

module.exports = {
  toTransfer,
  fromPayload
}

