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

exports.prepareTransfer = function (request, reply) {
  Model.prepare(request.payload)
    .then(Handle.createResponse(reply, buildResponseTransfer))
    .catch(Handle.error(request, reply))
}

exports.fulfillTransfer = function (request, reply) {
  Model.fulfill(request.payload)
    .then(Handle.getResponse(reply, x => x))
    .catch(Handle.error(request, reply))
}
