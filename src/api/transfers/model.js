'use strict'

const Eventric = require('../../lib/eventric')

function parseIdFor (transfer) {
  return transfer.id.substr(transfer.id.lastIndexOf('/') + 1)
}

exports.prepare = (transfer) => {
  return Eventric.getContext()
  .then(context => {
    context.command('PrepareTransfer', {
      id: parseIdFor(transfer),
      ledger: transfer.ledger,
      debits: transfer.debits,
      credits: transfer.credits,
      execution_condition: transfer.execution_condition,
      expires_at: transfer.expires_at
    })
  }).then(() => {
    return {
      id: transfer.id,
      ledger: transfer.ledger,
      debits: transfer.debits,
      credits: transfer.credits,
      execution_condition: transfer.execution_condition,
      expires_at: transfer.expires_at
    }
  })
}

exports.fulfill = (fulfillment) => {
  return Eventric.getContext()
  .then(context => {
    context.command('FulfillTransfer', {
      id: fulfillment.id,
      fulfillment: fulfillment.fulfillment
    })
  }).then(() => {
    return fulfillment.fulfillment
  })
}
