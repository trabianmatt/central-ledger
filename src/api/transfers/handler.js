'use strict'

const NotFoundError = require('@leveloneproject/central-services-shared').NotFoundError

const Model = require('./model')
const TransfersReadModel = require('../../models/transfers-read-model')
const Validator = require('./validator')
const UrlParser = require('../../lib/urlparser')
const TransferState = require('../../domain/transfer/state')

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
  if (!record) throw new NotFoundError('The requested resource could not be found.')
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

exports.prepareTransfer = function (request, reply) {
  return Validator.validate(request.payload, request.params.id)
    .then(Model.prepare)
    .then(transfer => reply(buildPrepareTransferResponse(transfer)).code((transfer.existing === true) ? 200 : 201))
    .catch(e => reply(e))
}

exports.fulfillTransfer = function (request, reply) {
  let fulfillment = {
    id: request.params.id,
    fulfillment: request.payload
  }

  return Model.fulfill(fulfillment)
    .then(result => reply(result).type('text/plain'))
    .catch(e => reply(e))
}

exports.rejectTransfer = function (request, reply) {
  let rejection = {
    id: request.params.id,
    rejection_reason: request.payload
  }

  return Model.reject(rejection)
  .then(reason => reply(reason).type('text/plain'))
  .catch(e => reply(e))
}

exports.getTransferById = function (request, reply) {
  return TransfersReadModel.getById(request.params.id)
    .then(buildGetTransferResponse)
    .then(result => reply(result))
    .catch(e => reply(e))
}

exports.getTransferFulfillment = function (request, reply) {
  return TransfersReadModel.getById(request.params.id)
    .then((transfer) => {
      if (!transfer || transfer.state !== TransferState.EXECUTED) {
        throw new NotFoundError('The requested resource could not be found.')
      }
      return transfer.fulfillment
    })
    .then(result => reply(result).type('text/plain'))
    .catch(e => reply(e))
}
