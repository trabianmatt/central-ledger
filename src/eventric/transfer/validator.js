'use strict'

const P = require('bluebird')
const _ = require('lodash')
const TransferState = require('./transfer-state')
const CryptoFulfillments = require('../../cryptoConditions/fulfillments')
const UnpreparedTransferError = require('../../errors/unprepared-transfer-error')
const AlreadyExistsError = require('../../errors/already-exists-error')

exports.validateFulfillment = (transfer, fulfillment) => {
  return P.resolve().then(() => {
    if (transfer.state === TransferState.EXECUTED && transfer.fulfillment === fulfillment) {
      return {
        previouslyFulfilled: true,
        transfer
      }
    }

    if (transfer.state !== TransferState.PREPARED) {
      throw new UnpreparedTransferError()
    }

    CryptoFulfillments.validateConditionFulfillment(transfer.execution_condition, fulfillment)

    return {
      previouslyFulfilled: false,
      transfer
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
