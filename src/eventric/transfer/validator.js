'use strict'

const P = require('bluebird')
const _ = require('lodash')
const Moment = require('moment')
const TransferState = require('./state')
const CryptoFulfillments = require('../../crypto-conditions/fulfillments')
const UnpreparedTransferError = require('../../errors/unprepared-transfer-error')
const AlreadyExistsError = require('../../errors/already-exists-error')
const ExpiredTransferError = require('../../errors/expired-transfer-error')

exports.validateFulfillment = ({state, fulfillment, execution_condition, expires_at}, fulfillmentCondition) => {
  return P.resolve().then(() => {
    if (state === TransferState.EXECUTED && fulfillment === fulfillmentCondition) {
      return {
        previouslyFulfilled: true
      }
    }

    if (state !== TransferState.PREPARED) {
      throw new UnpreparedTransferError()
    }

    if (Moment.utc().isAfter(Moment(expires_at))) {
      throw new ExpiredTransferError()
    }

    CryptoFulfillments.validateConditionFulfillment(execution_condition, fulfillmentCondition)

    return {
      previouslyFulfilled: false
    }
  })
}

exports.validateExistingOnPrepare = (proposed, existing) => {
  return P.resolve().then(() => {
    if (existing.state !== TransferState.PREPARED || !_.isMatch(existing, _.omit(proposed, ['id']))) {
      throw new AlreadyExistsError()
    }
    return existing
  })
}

exports.validateReject = ({state, credits = []}, rejectionReason) => {
  return P.resolve().then(() => {
    if (state === TransferState.REJECTED && credits.some(x => x.rejection_message === rejectionReason)) {
      return { alreadyRejected: true }
    }

    if (state !== TransferState.PREPARED) {
      throw new UnpreparedTransferError()
    }

    return { alreadyRejected: false }
  })
}
