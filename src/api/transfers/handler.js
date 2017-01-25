'use strict'

const NotFoundError = require('@leveloneproject/central-services-shared').NotFoundError

const Model = require('./model')
const TransfersReadModel = require('../../models/transfers-read-model')
const Validator = require('./validator')
const TransferState = require('../../domain/transfer/state')
const TransferTranslator = require('../../adapters/transfer-translator')

const buildGetTransferResponse = (record) => {
  if (!record) {
    throw new NotFoundError('The requested resource could not be found.')
  }
  return TransferTranslator.toTransfer(record)
}

exports.prepareTransfer = function (request, reply) {
  return Validator.validate(request.payload, request.params.id)
    .then(Model.prepare)
    .then(transfer => reply(TransferTranslator.toTransfer(transfer)).code((transfer.existing === true) ? 200 : 201))
    .catch(e => reply(e))
}

exports.fulfillTransfer = function (request, reply) {
  const fulfillment = {
    id: request.params.id,
    fulfillment: request.payload
  }

  return Model.fulfill(fulfillment)
    .then(transfer => reply(TransferTranslator.toTransfer(transfer)).code(200))
    .catch(e => reply(e))
}

exports.rejectTransfer = function (request, reply) {
  const rejection = {
    id: request.params.id,
    rejection_reason: request.payload
  }

  return Model.reject(rejection)
  .then(transfer => reply(TransferTranslator.toTransfer(transfer)).code(200))
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
