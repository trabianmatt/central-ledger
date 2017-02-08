'use strict'

const P = require('bluebird')
const _ = require('lodash')
const Moment = require('moment')
const TransferState = require('../../domain/transfer/state')
const CryptoConditions = require('../../crypto-conditions')
const Errors = require('../../errors')

const validateFulfillment = ({state, fulfillment, execution_condition, expires_at}, fulfillmentCondition) => {
  return P.resolve().then(() => {
    if (!execution_condition) { // eslint-disable-line
      throw new Errors.TransferNotConditionalError()
    }
    if ((state === TransferState.EXECUTED || state === TransferState.SETTLED) && fulfillment === fulfillmentCondition) {
      return {
        previouslyFulfilled: true
      }
    }

    if (state !== TransferState.PREPARED) {
      throw new Errors.InvalidModificationError(`Transfers in state ${state} may not be executed`)
    }

    if (Moment.utc().isAfter(Moment(expires_at))) {
      throw new Errors.ExpiredTransferError()
    }

    CryptoConditions.validateFulfillment(fulfillmentCondition, execution_condition)

    return {
      previouslyFulfilled: false
    }
  })
}

const validateExistingOnPrepare = (proposed, existing) => {
  return P.resolve().then(() => {
    if (existing.state !== TransferState.PREPARED || !_.isMatch(existing, _.omit(proposed, ['id']))) {
      throw new Errors.InvalidModificationError('Transfer may not be modified in this way')
    }
    return existing
  })
}

const validateReject = ({state, rejection_reason, execution_condition}, rejectionReason) => {
  return P.resolve().then(() => {
    if (!execution_condition) { // eslint-disable-line
      throw new Errors.TransferNotConditionalError()
    }
    if (state === TransferState.REJECTED && rejection_reason === rejectionReason) { // eslint-disable-line
      return { alreadyRejected: true }
    }

    if (state !== TransferState.PREPARED) {
      throw new Errors.InvalidModificationError(`Transfers in state ${state} may not be rejected`)
    }

    return { alreadyRejected: false }
  })
}

const validateSettle = ({id, state}) => {
  return P.resolve().then(() => {
    if (state !== TransferState.EXECUTED) {
      throw new Errors.UnexecutedTransferError()
    }
    return
  })
}

module.exports = {
  validateExistingOnPrepare,
  validateFulfillment,
  validateReject,
  validateSettle
}
