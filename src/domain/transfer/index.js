'use strict'

const P = require('bluebird')
const TransfersReadModel = require('./models/transfers-read-model')
const SettleableTransfersReadModel = require('../../models/settleable-transfers-read-model')
const SettlementsModel = require('../../models/settlements')
const Commands = require('./commands')
const Translator = require('./translator')
const RejectionType = require('./rejection-type')
const State = require('./state')
const Events = require('../../lib/events')
const Errors = require('../../errors')

const getById = (id) => {
  return TransfersReadModel.getById(id)
}

const getFulfillment = (id) => {
  return TransfersReadModel.getById(id)
  .then(transfer => {
    if (!transfer) {
      throw new Errors.TransferNotFoundError()
    }
    if (!transfer.executionCondition) {
      throw new Errors.TransferNotConditionalError()
    }
    if (transfer.state === State.REJECTED) {
      throw new Errors.AlreadyRolledBackError()
    }
    if (!transfer.fulfillment) {
      throw new Errors.MissingFulfillmentError()
    }
    return transfer.fulfillment
  })
}

const prepare = (payload) => {
  const transfer = Translator.fromPayload(payload)

  return Commands.prepare(transfer)
    .then(result => {
      const t = Translator.toTransfer(result.transfer)
      Events.emitTransferPrepared(t)
      return { existing: result.existing, transfer: t }
    })
}

const reject = (rejection) => {
  return Commands.reject(rejection)
    .then(transfer => {
      const t = Translator.toTransfer(transfer)
      Events.emitTransferRejected(t)
      return t
    })
}

const expire = (id) => {
  return reject({ id, rejection_reason: RejectionType.EXPIRED })
}

const fulfill = (fulfillment) => {
  return Commands.fulfill(fulfillment)
    .then(transfer => {
      const t = Translator.toTransfer(transfer)
      Events.emitTransferExecuted(t, { execution_condition_fulfillment: fulfillment.fulfillment })
      return t
    })
    .catch(Errors.ExpiredTransferError, () => {
      return expire(fulfillment.id)
      .then(() => { throw new Errors.UnpreparedTransferError() })
    })
}

const rejectExpired = () => {
  const rejections = TransfersReadModel.findExpired().then(expired => expired.map(x => expire(x.transferUuid)))
  return P.all(rejections).then(rejections => {
    return rejections.map(r => r.id)
  })
}

const settle = () => {
  const settlementId = SettlementsModel.generateId()
  const settledTransfers = SettlementsModel.create(settlementId).then(() => {
    return SettleableTransfersReadModel.getSettleableTransfers().then(
      transfers => transfers.map(x => Commands.settle({id: x.transferId, settlement_id: settlementId})))
  })

  return P.all(settledTransfers).then(settledTransfers => {
    if (settledTransfers.length > 0) {
      return settledTransfers.map(t => t.id)
    } else {
      return P.resolve([])
    }
  })
}

module.exports = {
  fulfill,
  getById,
  getFulfillment,
  prepare,
  reject,
  rejectExpired,
  settle
}

