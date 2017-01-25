'use strict'

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

  TransferRejected ({ rejection_reason }) {
    this.rejection_reason = rejection_reason // eslint-disable-line
    return this
  },

  TransferSettled ({ settlement_id }) {
    this.settlement_id = settlement_id // eslint-disable-line
    return this
  }
}
