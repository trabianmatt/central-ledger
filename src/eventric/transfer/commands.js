'use strict'

const P = require('bluebird')
const Validator = require('./validator')
const AggregateNotFoundError = require('../../errors/aggregate-not-found-error')
const NotFoundError = require('../../errors/not-found-error')

module.exports = {
  PrepareTransfer (proposed) {
    let {id, ledger, debits, credits, execution_condition, expires_at} = proposed
    return P.resolve()
    .then(() => this.$aggregate.load('Transfer', id))
    .then(existing => Validator.validateExistingOnPrepare(proposed, existing))
    .then(existing => { return { existing: true, transfer: existing } })
    .catch(AggregateNotFoundError, e => {
      return this.$aggregate.create('Transfer', {
        ledger,
        debits,
        credits,
        execution_condition,
        expires_at
      })
      .then(transfer => {
        transfer.$setIdForCreation(id)
        return transfer.$save().then(() => { return { existing: false, transfer } })
      })
    })
  },

  FulfillTransfer ({
      id, fulfillment
    }) {
    return P.resolve()
      .then(() => this.$aggregate.load('Transfer', id))
      .then(transfer => { return Validator.validateFulfillment(transfer, fulfillment) })
      .then(result => {
        let transfer = result.transfer
        if (result.previouslyFulfilled) {
          return transfer
        } else {
          transfer.fulfill({fulfillment})
          return transfer.$save().then(() => transfer)
        }
      }).catch(AggregateNotFoundError, () => {
        throw new NotFoundError()
      })
  }
}
