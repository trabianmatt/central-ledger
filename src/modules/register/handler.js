'use strict'

const Model = require('./model')
const Handle = require('../../lib/handler')

function respond (reply, statusCode) {
  return (entity) => {
    reply(buildResponseRegistration(entity)).code(statusCode)
  }
}

function buildResponseRegistration (record) {
  return {
    identifier: record.identifier,
    name: record.name,
    created: record.createdDate
  }
}

exports.register = function (request, reply) {
  Model.getByIdentifier(request.payload.identifier)
    .then((entity) => {
      if (entity) {
        Handle.badRequest(reply, 'The identifier has already been registered')
      } else {
        return Model.create(request.payload)
                .then(respond(reply, 201))
                .catch(Handle.error(request, reply))
      }
    })
    .catch(Handle.error(request, reply))
}
