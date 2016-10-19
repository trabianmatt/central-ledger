'use strict'

const Events = require('../../lib/events')
const UrlParser = require('../../lib/urlparser')
const Commands = require('../../commands/transfer')

let cleanTransfer = (transfer) => {
  return {
    id: UrlParser.toTransferUri(transfer.id),
    ledger: transfer.ledger,
    credits: transfer.credits,
    debits: transfer.debits,
    execution_condition: transfer.execution_condition,
    expires_at: transfer.expires_at,
    timeline: transfer.timeline
  }
}

exports.prepare = (transfer) => {
  let payload = {
    id: UrlParser.idFromTransferUri(transfer.id),
    ledger: transfer.ledger,
    debits: transfer.debits,
    credits: transfer.credits,
    execution_condition: transfer.execution_condition,
    expires_at: transfer.expires_at
  }
  return Commands.prepare(payload)
    .then(result => {
      let t = cleanTransfer(result.transfer)
      Events.emitTransferPrepared(t)
      t.existing = result.existing
      return t
    })
}

exports.fulfill = (fulfillment) => {
  return Commands.fulfill(fulfillment)
  .then(transfer => {
    let t = cleanTransfer(transfer)
    Events.emitTransferExecuted(t, { execution_condition_fulfillment: fulfillment.fulfillment })
    return fulfillment.fulfillment
  })
}

exports.reject = (rejection) => {
  return Commands.reject(rejection)
  .then(result => {
    let t = cleanTransfer(result.transfer)
    Events.emitTransferRejected(t)
    return result.rejection_reason
  })
}
