'use strict'

const P = require('bluebird')
const _ = require('lodash')
const Moment = require('moment')
const TransferState = require('../../domain/transfer/state')
const CryptoConditions = require('../../crypto-conditions')
const UnpreparedTransferError = require('../../errors/unprepared-transfer-error')
const UnexecutedTransferError = require('../../errors/unexecuted-transfer-error')
const AlreadyExistsError = require('../../errors/already-exists-error')
const ExpiredTransferError = require('../../errors/expired-transfer-error')

exports.validateFulfillment = ({state, fulfillment, execution_condition, expires_at}, fulfillmentCondition) => {
  return P.resolve().then(() => {
    if ((state === TransferState.EXECUTED || state === TransferState.SETTLED) && fulfillment === fulfillmentCondition) {
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

    CryptoConditions.validateFulfillment(fulfillmentCondition, execution_condition)

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

exports.validateReject = ({state, rejection_reason}, rejectionReason) => {
  return P.resolve().then(() => {
    if (state === TransferState.REJECTED && rejection_reason === rejectionReason) { // eslint-disable-line
      return { alreadyRejected: true }
    }

    if (state !== TransferState.PREPARED) {
      throw new UnpreparedTransferError()
    }

    return { alreadyRejected: false }
  })
}

exports.validateSettle = ({id, state}) => {
  return P.resolve().then(() => {
    if (state !== TransferState.EXECUTED) {
      throw new UnexecutedTransferError()
    }
    return
  })
}
