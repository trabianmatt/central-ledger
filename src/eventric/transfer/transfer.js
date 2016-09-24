'use strict'

const CryptoConditions = require('../../cryptoConditions/conditions')
const CryptoFulfillments = require('../../cryptoConditions/fulfillments')
const TransferState = require('./transferState')

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
    if (this.state !== TransferState.PREPARED) {
      throw new Error('transfer exists, but is not prepared')
    }

    CryptoFulfillments.validateConditionFulfillment(this.execution_condition, fulfillment)

    return this.$emitDomainEvent('TransferExecuted')
  }

  handleTransferPrepared (event) {
    this.ledger = event.payload.ledger
    this.debits = event.payload.debits
    this.credits = event.payload.credits
    this.execution_condition = event.payload.execution_condition
    this.expires_at = event.payload.expires_at
    this.state = TransferState.PREPARED
  }

  handleTransferExecuted (event) {
    this.state = TransferState.EXECUTED
  }
}

module.exports = Transfer
