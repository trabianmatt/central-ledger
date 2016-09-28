'use strict'

const Model = require('../../models/accounts')
const Handle = require('../../lib/handler')
const Config = require('../../lib/config')
const RecordExistsError = require('../../errors/record-exists-error')
const NotFoundError = require('../../errors/not-found-error')

function buildResponse (record) {
  return {
    id: `${Config.HOSTNAME}/accounts/${record.name}`,
    name: record.name,
    created: record.createdDate,
    balance: 1000000.00,
    is_disabled: false,
    ledger: Config.HOSTNAME
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

function createAccount (payload) {
  return (entity) => {
    return Model.create(payload)
  }
}

exports.create = (request, reply) => {
  Model.getByName(request.payload.name)
    .then(handleExistingRecord())
    .then(createAccount(request.payload))
    .then(Handle.createResponse(reply, buildResponse))
    .catch(RecordExistsError, Handle.badRequest(reply, 'The account has already been registered'))
    .catch(Handle.error(request, reply))
}

exports.getByName = (request, reply) => {
  Model.getByName(request.params.name)
    .then(Handle.getResponse(reply, buildResponse))
    .catch(NotFoundError, Handle.notFound(reply))
    .catch(Handle.error(request, reply))
}
