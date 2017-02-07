'use strict'

const Moment = require('moment')
const TransferState = require('../../domain/transfer/state')
const TransferRejectionType = require('../../domain/transfer/rejection-type')

class Transfer {
  create ({
      ledger,
      debits,
      credits,
      execution_condition,
      expires_at
    }) {
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
    const time = Moment(event.timestamp).toISOString()
    const timeline = {
      prepared_at: time
    }

    let state = TransferState.PREPARED
    const executionCondition = event.payload.execution_condition
    if (!executionCondition) {
      state = TransferState.EXECUTED
      timeline.executed_at = time
    }
    this.state = state
    this.timeline = timeline
    return this
  }

  handleTransferExecuted (event) {
    this.state = TransferState.EXECUTED
    this.fulfillment = event.payload.fulfillment
    this.timeline = this.timeline || {}
    this.timeline.executed_at = Moment(event.timestamp).toISOString()
    return this
  }

  handleTransferRejected ({timestamp, payload}) {
    const reason = payload.rejection_reason // eslint-disable-line
    this.state = TransferState.REJECTED
    this.rejection_reason = reason // eslint-disable-line
    this.timeline = this.timeline || {}
    this.timeline.rejected_at = new Date(timestamp).toISOString()
    if (reason === TransferRejectionType.CANCELLED && this.credits) {
      this.credits[0].rejected = true
      this.credits[0].rejection_message = payload.message || ''
    }
    return this
  }

  handleTransferSettled (event) {
    this.state = TransferState.SETTLED
    this.settlement_id = event.payload.settlement_id

    return this
  }
}

module.exports = Transfer
