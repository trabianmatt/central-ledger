'use strict'

const Model = require('./model')
const Handle = require('../../lib/handler')
const RecordExistsError = require('../../errors/record-exists-error')

function buildResponseRegistration (record) {
  return {
    identifier: record.identifier,
    name: record.name,
    created: record.createdDate
  }
}

function handleExistingRecord () {
  return (entity) => {
    if (entity) {
      throw new RecordExistsError()
    } else {
      return entity
    }
  }
}

function createRegistration (payload) {
  return (entity) => {
    return Model.create(payload)
  }
}

exports.register = function (request, reply) {
  Model.getByIdentifier(request.payload.identifier)
    .then(handleExistingRecord())
    .then(createRegistration(request.payload))
    .then(Handle.createResponse(reply, buildResponseRegistration))
    .catch(RecordExistsError, Handle.badRequest(reply, 'The identifier has already been registered'))
    .catch(Handle.error(request, reply))
}
