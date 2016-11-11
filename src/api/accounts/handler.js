'use strict'

const Model = require('../../models/accounts')
const Handle = require('../../lib/handler')
const Config = require('../../lib/config')
const UrlParser = require('../../lib/urlparser')
const PositionService = require('../../services/position')
const NotFoundError = require('../../errors/not-found-error')
const RecordExistsError = require('../../errors/record-exists-error')

function buildResponse (account, position) {
  return {
    id: UrlParser.toAccountUri(account.name),
    name: account.name,
    created: account.createdDate,
    balance: position.net,
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
    .then(Handle.createResponse(reply, account => buildResponse(account, { net: '0' })))
    .catch(RecordExistsError, Handle.unprocessableEntity(reply, 'The account has already been registered'))
    .catch(Handle.error(request, reply))
}

exports.getByName = (request, reply) => {
  Model.getByName(request.params.name)
    .then(account => {
      if (!account) {
        throw new NotFoundError()
      }

      return PositionService.calculateForAccount(account)
        .then(Handle.getResponse(reply, position => buildResponse(account, position)))
    })
    .catch(NotFoundError, Handle.notFound(reply))
    .catch(Handle.error(request, reply))
}
