'use strict'

const RejectionType = require('../../domain/transfer/rejection-type')

module.exports = {
  TransferPrepared ({
    ledger,
    debits,
    credits,
    execution_condition,
    expires_at
  }) {
    this.ledger = ledger
    this.debits = debits
    this.credits = credits
    this.execution_condition = execution_condition // eslint-disable-line
    this.expires_at = expires_at // eslint-disable-line
    return this
  },

  TransferExecuted ({ fulfillment }) {
    this.fulfillment = fulfillment
    return this
  },

  TransferRejected ({ rejection_reason, rejection_type }) {
    this.rejection_reason = rejection_reason // eslint-disable-line
    this.rejection_type = rejection_type || RejectionType.CANCELED // eslint-disable-line
    return this
  }
}
