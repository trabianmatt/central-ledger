'use strict'

const Model = require('./model')
const Handle = require('../../lib/handler')

function respond (reply, statusCode) {
  return (entity) => {
    if (entity) {
      reply(buildResponseRegistration(entity)).code(statusCode)
    }
  }
}

function buildResponseRegistration (record) {
  return {
    identifier: record.identifier,
    name: record.name,
    created: record.createdDate
  }
}

function handleExistingRecord (reply) {
  return (entity) => {
    if (entity) {
      Handle.badRequest(reply, 'The identifier has already been registered')
    }
    return entity
  }
}

function createRegistration (payload) {
  return (entity) => {
    if (!entity) {
      return Model.create(payload)
    }
  }
}

exports.register = function (request, reply) {
  Model.getByIdentifier(request.payload.identifier)
    .then(handleExistingRecord(reply))
    .then(createRegistration(request.payload))
    .then(respond(reply, 201))
    .catch(Handle.error(request, reply))
}
