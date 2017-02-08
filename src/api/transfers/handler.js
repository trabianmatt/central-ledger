'use strict'

const Validator = require('./validator')
const TransferService = require('../../domain/transfer')
const TransferRejectionType = require('../../domain/transfer/rejection-type')
const TransferTranslator = require('../../domain/transfer/translator')
const NotFoundError = require('../../errors').NotFoundError

const buildGetTransferResponse = (record) => {
  if (!record) {
    throw new NotFoundError('The requested resource could not be found.')
  }
  return TransferTranslator.toTransfer(record)
}

exports.prepareTransfer = function (request, reply) {
  return Validator.validate(request.payload, request.params.id)
    .then(TransferService.prepare)
    .then(result => reply(result.transfer).code((result.existing === true) ? 200 : 201))
    .catch(reply)
}

exports.fulfillTransfer = function (request, reply) {
  const fulfillment = {
    id: request.params.id,
    fulfillment: request.payload
  }

  return TransferService.fulfill(fulfillment)
    .then(transfer => reply(transfer).code(200))
    .catch(reply)
}

exports.rejectTransfer = function (request, reply) {
  const rejection = {
    id: request.params.id,
    rejection_reason: TransferRejectionType.CANCELLED,
    message: request.payload
  }

  return TransferService.reject(rejection)
  .then(transfer => reply(transfer).code(200))
  .catch(reply)
}

exports.getTransferById = function (request, reply) {
  return TransferService.getById(request.params.id)
    .then(buildGetTransferResponse)
    .then(result => reply(result))
    .catch(reply)
}

exports.getTransferFulfillment = function (request, reply) {
  return TransferService.getFulfillment(request.params.id)
  .then(result => reply(result).type('text/plain'))
  .catch(reply)
}
