'use strict'

const Moment = require('moment')
const CryptoConditions = require('../../crypto-conditions/conditions')
const TransferState = require('../../domain/transfer/state')

class Transfer {
  create ({
      ledger,
      debits,
      credits,
      execution_condition,
      expires_at
    }) {
    CryptoConditions.validateCondition(execution_condition)

    return this.$emitDomainEvent('TransferPrepared', {
      ledger,
      debits,
      credits,
      execution_condition,
      expires_at
    })
  }

  fulfill (payload) {
    return this.$emitDomainEvent('TransferExecuted', payload)
  }

  reject (payload) {
    return this.$emitDomainEvent('TransferRejected', payload)
  }

  settle (payload) {
    return this.$emitDomainEvent('TransferSettled', payload)
  }

  handleTransferPrepared (event) {
    this.id = event.aggregate.id
    this.ledger = event.payload.ledger
    this.debits = event.payload.debits
    this.credits = event.payload.credits
    this.execution_condition = event.payload.execution_condition
    this.expires_at = event.payload.expires_at
    this.state = TransferState.PREPARED
    this.timeline = { prepared_at: Moment(event.timestamp).toISOString() }
    return this
  }

  handleTransferExecuted (event) {
    this.state = TransferState.EXECUTED
    this.fulfillment = event.payload.fulfillment
    return this
  }

  handleTransferRejected (event) {
    let rejection_reason = event.payload.rejection_reason // eslint-disable-line
    let credits = this.credits || []
    credits.forEach(c => {
      c.rejection_message = rejection_reason // eslint-disable-line
      c.rejected = true
    })
    this.state = TransferState.REJECTED
    this.rejection_reason = rejection_reason // eslint-disable-line
    this.timeline = this.timeline || {}
    this.timeline.rejected_at = new Date(event.timestamp).toISOString()
    return this
  }

  handleTransferSettled (event) {
    this.state = TransferState.SETTLED
    this.settlement_id = event.payload.settlement_id

    return this
  }
}

module.exports = Transfer
