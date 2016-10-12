'use strict'

module.exports = {
  /*eslint-disable */
  TransferPrepared({
    ledger,
    debits,
    credits,
    execution_condition,
    expires_at
  }) {
    this.ledger = ledger
    this.debits = debits
    this.credits = credits
    this.execution_condition = execution_condition
    this.expires_at = expires_at
    return this
  },

  TransferExecuted({
    ledger,
    debits,
    credits,
    execution_condition,
    expires_at,
    fulfillment
  }) {
    this.ledger = ledger
    this.debits = debits
    this.credits = credits
    this.execution_condition = execution_condition
    this.expires_at = expires_at
    this.fulfillment = fulfillment
    return this
  }
  /*eslint-enable */
}
