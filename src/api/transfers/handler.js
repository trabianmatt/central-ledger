'use strict'

const Model = require('./model')
const TransfersReadModel = require('../../models/transfers-read-model')
const Validator = require('./validator')
const Handle = require('../../lib/handler')
const UrlParser = require('../../lib/urlparser')
const TransferState = require('../../domain/transfer/state')
const ValidationError = require('../../errors/validation-error')
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
    id: UrlParser.toTransferUri(record.transferUuid),
    ledger: record.ledger,
    debits: [{
      account: UrlParser.toAccountUri(record.debitAccountName),
      amount: record.debitAmount
    }],
    credits: [{
      account: UrlParser.toAccountUri(record.creditAccountName),
      amount: record.creditAmount,
      rejected: Boolean(record.creditRejected),
      rejection_message: record.creditRejectionMessage
    }],
    execution_condition: record.executionCondition,
    expires_at: record.expiresAt,
    state: record.state,
    rejection_reason: record.rejectionReason,
    timeline: {
      prepared_at: record.preparedDate,
      executed_at: record.executedDate,
      rejected_at: record.rejectedDate
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
  let rejection = {
    id: request.params.id,
    rejection_reason: request.payload
  }

  return Model.reject(rejection)
  .then(Handle.getResponse(reply, x => x, { contentType: 'text/plain' }))
  .catch(UnpreparedTransferError, Handle.unprocessableEntity(reply))
  .catch(NotFoundError, Handle.notFound(reply))
  .catch(Handle.error(request, reply))
}

exports.getTransferById = function (request, reply) {
  return TransfersReadModel.getById(request.params.id)
    .then(Handle.getResponse(reply, buildGetTransferResponse))
    .catch(NotFoundError, Handle.notFound(reply))
    .catch(Handle.error(request, reply))
}

exports.getTransferFulfillment = function (request, reply) {
  return TransfersReadModel.getById(request.params.id)
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
