'use strict'

const Model = require('../../models/accounts')
const Config = require('../../lib/config')
const UrlParser = require('../../lib/urlparser')
const PositionService = require('../../services/position')
const NotFoundError = require('@leveloneproject/central-services-shared').NotFoundError
const RecordExistsError = require('../../errors/record-exists-error')

function buildResponse (account, { net = '0' } = {}) {
  return {
    id: UrlParser.toAccountUri(account.name),
    name: account.name,
    created: account.createdDate,
    balance: net,
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

function getPosition (account) {
  if (!account) throw new NotFoundError('The requested resource could not be found.')
  return PositionService.calculateForAccount(account)
    .then(position => {
      if (!position) throw new NotFoundError('The requested resource could not be found.')
      return buildResponse(account, position)
    })
}

exports.create = (request, reply) => {
  Model.getByName(request.payload.name)
    .then(handleExistingRecord())
    .then(createAccount(request.payload))
    .then(account => reply(buildResponse(account)).code(201))
    .catch(e => reply(e))
}

exports.getByName = (request, reply) => {
  Model.getByName(request.params.name)
    .then(getPosition)
    .then(result => reply(result))
    .catch(e => reply(e))
}
