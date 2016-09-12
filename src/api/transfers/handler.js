'use strict'

const Model = require('./model')
const Handle = require('../../lib/handler')

var respond = (reply, statusCode) => {
  let code = statusCode || 200
  return (entity) => {
    if (entity) {
      reply(buildResponseTransfer(entity)).code(code)
      return entity
    }
  }
}

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

exports.createTransfer = function (request, reply) {
  Model.create(request.payload)
    .then(respond(reply, 201))
    .catch(Handle.error(request, reply))
}
