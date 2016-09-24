'use strict'

const Model = require('./model')
const Handle = require('../../lib/handler')

var buildResponseTransfer = (record) => {
  return {
    id: record.id,
    ledger: record.ledger,
    debits: record.debits,
    credits: record.credits,
    execution_condition: record.execution_condition,
    expires_at: record.expires_at
  }
}

function UnpreparedTransferError (e) {
  return e.originalErrorMessage === 'transfer exists, but is not prepared'
}

function AlreadyCreatedError (e) {
  return e.originalErrorMessage.includes('already created')
}

function NotFoundError (e) {
  return e.originalErrorMessage.includes('No domainEvents for aggregate of type Transfer')
}

exports.prepareTransfer = function (request, reply) {
  return Model.prepare(request.payload)
    .then(Handle.createResponse(reply, buildResponseTransfer))
    .catch(e => {
      if (AlreadyCreatedError(e)) {
        Handle.unprocessableEntity(reply, "Can't re-prepare an existing transfer.")(e)
      } else { Handle.error(request, reply)(e) }
    })
}

exports.fulfillTransfer = function (request, reply) {
  var fulfillment = {
    id: request.params.id,
    fulfillment: request.payload
  }

  return Model.fulfill(fulfillment)
    .then(Handle.getResponse(reply, x => x))
    .catch(e => {
      if (UnpreparedTransferError(e)) {
        Handle.unprocessableEntity(reply, "Can't execute a non-prepared transfer.")(e)
      } else if (NotFoundError(e)) {
        Handle.notFound(reply)(e)
      } else { Handle.error(request, reply)(e) }
    })
}
