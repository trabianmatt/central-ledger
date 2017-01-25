'use strict'

const Events = require('../../lib/events')
const UrlParser = require('../../lib/urlparser')
const Commands = require('../../commands/transfer')
const ExpiredTransferError = require('../../errors/expired-transfer-error')
const UnpreparedTransferError = require('../../errors/unprepared-transfer-error')

const cleanTransfer = (transfer) => {
  return {
    id: UrlParser.toTransferUri(transfer.id),
    ledger: transfer.ledger,
    credits: transfer.credits,
    debits: transfer.debits,
    execution_condition: transfer.execution_condition,
    expires_at: transfer.expires_at,
    state: transfer.state,
    timeline: transfer.timeline
  }
}

exports.prepare = (transfer) => {
  const payload = {
    id: UrlParser.idFromTransferUri(transfer.id),
    ledger: transfer.ledger,
    debits: transfer.debits,
    credits: transfer.credits,
    execution_condition: transfer.execution_condition,
    expires_at: transfer.expires_at
  }
  return Commands.prepare(payload)
    .then(result => {
      const t = cleanTransfer(result.transfer)
      Events.emitTransferPrepared(t)
      t.existing = result.existing
      return t
    })
}

exports.fulfill = (fulfillment) => {
  return Commands.fulfill(fulfillment)
  .then(transfer => {
    const t = cleanTransfer(transfer)
    Events.emitTransferExecuted(t, { execution_condition_fulfillment: fulfillment.fulfillment })
    return t
  })
  .catch(ExpiredTransferError, () => {
    return Commands.expire(fulfillment.id)
    .then(() => { throw new UnpreparedTransferError() })
  })
}

exports.reject = (rejection) => {
  return Commands.reject(rejection)
  .then(transfer => {
    const t = cleanTransfer(transfer)
    t.rejection_reason = transfer.rejection_reason
    Events.emitTransferRejected(t)
    return t
  })
}
