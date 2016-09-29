'use strict'

const CryptoConditions = require('../../cryptoConditions/conditions')
const CryptoFulfillments = require('../../cryptoConditions/fulfillments')
const TransferState = require('./transferState')
const UnpreparedTransferError = require('../../errors/unprepared-transfer-error')

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
      throw new UnpreparedTransferError()
    }

    CryptoFulfillments.validateConditionFulfillment(this.execution_condition, fulfillment)

    var payload = {}
    payload.ledger = this.ledger
    payload.debits = this.debits
    payload.credits = this.credits
    payload.execution_condition = this.execution_condition
    payload.expires_at = this.expires_at
    payload.fulfillment = fulfillment

    return this.$emitDomainEvent('TransferExecuted', payload)
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
