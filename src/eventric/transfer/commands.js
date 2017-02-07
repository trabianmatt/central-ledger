'use strict'

const P = require('bluebird')
const Validator = require('./validator')
const AggregateNotFoundError = require('../../errors/aggregate-not-found-error')
const NotFoundError = require('@leveloneproject/central-services-shared').NotFoundError

module.exports = {
  PrepareTransfer (proposed) {
    const {id, ledger, debits, credits, execution_condition, expires_at} = proposed
    return P.resolve(this.$aggregate.load('Transfer', id))
    .then(existing => Validator.validateExistingOnPrepare(proposed, existing))
    .then(existing => { return { existing: true, transfer: existing } })
    .catch(AggregateNotFoundError, () => {
      return this.$aggregate.create('Transfer', {
        ledger,
        debits,
        credits,
        execution_condition,
        expires_at
      }, id)
      .then(transfer => {
        return transfer.$save().then(() => ({ existing: false, transfer }))
      })
    })
  },

  FulfillTransfer ({ id, fulfillment }) {
    return P.resolve(this.$aggregate.load('Transfer', id))
      .then(transfer => {
        return Validator.validateFulfillment(transfer, fulfillment)
        .then(({ previouslyFulfilled }) => {
          if (previouslyFulfilled) {
            return transfer
          }
          transfer.fulfill({fulfillment})
          return transfer.$save().then(() => transfer)
        })
      })
      .catch(AggregateNotFoundError, () => {
        throw new NotFoundError('The requested resource could not be found.')
      })
  },

  RejectTransfer ({ id, rejection_reason, message }) {
    return P.resolve(this.$aggregate.load('Transfer', id))
      .then(transfer => {
        return Validator.validateReject(transfer, rejection_reason)
        .then(result => {
          if (result.alreadyRejected) {
            return transfer
          }
          transfer.reject({ rejection_reason: rejection_reason, message: message }) // eslint-disable-line
          return transfer.$save().then(() => transfer)
        })
      })
      .catch(AggregateNotFoundError, () => {
        throw new NotFoundError('The requested resource could not be found.')
      })
  },

  SettleTransfer ({id, settlement_id}) {
    return P.resolve(this.$aggregate.load('Transfer', id))
    .then(transfer => {
      return Validator.validateSettle(transfer)
      .then(() => {
        transfer.settle({settlement_id})
        return transfer.$save().then(() => transfer)
      })
    })
    .catch(AggregateNotFoundError, () => {
      throw new NotFoundError()
    })
  }
}
