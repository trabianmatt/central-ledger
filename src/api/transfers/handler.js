'use strict'

const Model = require('./model')
const Validator = require('./validator')
const Handle = require('../../lib/handler')
const Config = require('../../lib/config')
const TransferState = require('../../eventric/transfer/transfer-state')
const ValidationError = require('../../errors/validation-error')
const P = require('bluebird')
const NotFoundError = require('../../errors/not-found-error')
const AlreadyExistsError = require('../../errors/already-exists-error')
const UnpreparedTransferError = require('../../errors/unprepared-transfer-error')

let buildPrepareTransferResponse = (record) => {
  return {
    id: record.id,
    ledger: record.ledger,
    debits: record.debits,
    credits: record.credits,
    execution_condition: record.execution_condition,
    expires_at: record.expires_at,
    state: TransferState.PREPARED
  }
}

let buildGetTransferResponse = (record) => {
  return {
    id: `${Config.HOSTNAME}/transfers/${record.transferUuid}`,
    ledger: record.ledger,
    debits: [{
      account: record.debitAccount,
      amount: record.debitAmount
    }],
    credits: [{
      account: record.creditAccount,
      amount: record.creditAmount
    }],
    execution_condition: record.executionCondition,
    expires_at: record.expiresAt,
    state: record.state,
    timeline: {
      prepared_at: record.preparedDate,
      executed_at: record.executedDate
    }
  }
}

let buildGetTransferFulfillmentResponse = (record) => {
  return record.fulfillment
}

exports.prepareTransfer = function (request, reply) {
  return Validator.validate(request.payload, request.params.id)
    .then(Model.prepare)
    .then(Handle.putResponse(reply, buildPrepareTransferResponse))
    .catch(ValidationError, AlreadyExistsError, Handle.unprocessableEntity(reply))
    .catch(Handle.error(request, reply))
}

exports.fulfillTransfer = function (request, reply) {
  let fulfillment = {
    id: request.params.id,
    fulfillment: request.payload
  }

  return Model.fulfill(fulfillment)
    .then(Handle.getResponse(reply, x => x, { contentType: 'text/plain' }))
    .catch(UnpreparedTransferError, Handle.unprocessableEntity(reply))
    .catch(NotFoundError, Handle.notFound(reply))
    .catch(Handle.error(request, reply))
}

exports.rejectTransfer = function (request, reply) {
  let reason = request.payload
  return P.resolve(reason).then(Handle.getResponse(reply, x => x, { contentType: 'text/plain' }))
}

exports.getTransferById = function (request, reply) {
  return Model.getById(request.params.id)
    .then(Handle.getResponse(reply, buildGetTransferResponse))
    .catch(NotFoundError, Handle.notFound(reply))
    .catch(Handle.error(request, reply))
}

exports.getTransferFulfillment = function (request, reply) {
  return Model.getById(request.params.id)
    .then((transfer) => {
      if (transfer && transfer.state !== TransferState.EXECUTED) {
        throw new NotFoundError()
      }
      return transfer
    })
    .then(Handle.getResponse(reply, buildGetTransferFulfillmentResponse, { contentType: 'text/plain' }))
    .catch(NotFoundError, Handle.notFound(reply))
    .catch(Handle.error(request, reply))
}
