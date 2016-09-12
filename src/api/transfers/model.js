'use strict'

const Eventric = require('../../lib/eventric')

exports.create = (transfer) => {
  return Eventric.getContext()
  .then(context => {
    context.command('ProposeTransfer', {
      id: transfer.id,
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
