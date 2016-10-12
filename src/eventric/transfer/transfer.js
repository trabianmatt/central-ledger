'use strict'

const CryptoConditions = require('../../cryptoConditions/conditions')
const TransferState = require('./transfer-state')

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

  fulfill ({ fulfillment }) {
    let payload = {
      ledger: this.ledger,
      debits: this.debits,
      credits: this.credits,
      execution_condition: this.execution_condition,
      expires_at: this.expires_at,
      fulfillment: fulfillment
    }

    return this.$emitDomainEvent('TransferExecuted', payload)
  }

  handleTransferPrepared (event) {
    this.ledger = event.payload.ledger
    this.debits = event.payload.debits
    this.credits = event.payload.credits
    this.execution_condition = event.payload.execution_condition
    this.expires_at = event.payload.expires_at
    this.state = TransferState.PREPARED
    return this
  }

  handleTransferExecuted (event) {
    this.state = TransferState.EXECUTED
    this.fulfillment = event.payload.fulfillment
    return this
  }
}

module.exports = Transfer
