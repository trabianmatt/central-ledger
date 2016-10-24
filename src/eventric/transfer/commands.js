'use strict'

const P = require('bluebird')
const Validator = require('./validator')
const AggregateNotFoundError = require('../../errors/aggregate-not-found-error')
const NotFoundError = require('../../errors/not-found-error')

module.exports = {
  PrepareTransfer (proposed) {
    let {id, ledger, debits, credits, execution_condition, expires_at} = proposed
    return P.resolve(this.$aggregate.load('Transfer', id))
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

  FulfillTransfer ({ id, fulfillment }) {
    return P.resolve(this.$aggregate.load('Transfer', id))
      .then(transfer => {
        return Validator.validateFulfillment(transfer, fulfillment)
        .then(({ previouslyFulfilled }) => {
          if (previouslyFulfilled) { return transfer }
          transfer.fulfill({fulfillment})
          return transfer.$save().then(() => transfer)
        })
      })
      .catch(AggregateNotFoundError, () => {
        throw new NotFoundError()
      })
  },

  RejectTransfer ({ id, rejection_reason, rejection_type }) {
    return P.resolve(this.$aggregate.load('Transfer', id))
      .then(transfer => {
        return Validator.validateReject(transfer, rejection_reason)
        .then(result => {
          if (result.alreadyRejected) return { transfer, rejection_reason }// eslint-disable-line
          transfer.reject({ rejection_reason: rejection_reason, rejection_type: rejection_type }) // eslint-disable-line
          return transfer.$save().then(() => { return { transfer, rejection_reason } }) // eslint-disable-line
        })
      })
      .catch(AggregateNotFoundError, () => {
        throw new NotFoundError()
      })
  }
}
