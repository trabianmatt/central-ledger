'use strict'

const Account = require('../../domain/account')
const Config = require('../../lib/config')
const UrlParser = require('../../lib/urlparser')
const PositionService = require('../../services/position')
const NotFoundError = require('@leveloneproject/central-services-shared').NotFoundError
const RecordExistsError = require('../../errors/record-exists-error')

function buildResponse (account, { net = '0' } = {}) {
  const response = {
    id: UrlParser.toAccountUri(account.name),
    name: account.name,
    created: account.createdDate,
    balance: net,
    is_disabled: false,
    ledger: Config.HOSTNAME
  }
  if (account.credentials) {
    response.credentials = account.credentials
  }
  return response
}

function entityItem ({name, createdDate}) {
  const link = UrlParser.toAccountUri(name)
  return {
    id: link,
    name,
    created: createdDate,
    is_disabled: false,
    '_links': {
      self: link
    }
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
    return Account.create(payload)
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
  Account.getByName(request.payload.name)
    .then(handleExistingRecord())
    .then(createAccount(request.payload))
    .then(account => reply(buildResponse(account)).code(201))
    .catch(e => reply(e))
}

exports.getAll = (request, reply) => {
  Account.getAll()
    .then(results => results.map(entityItem))
    .then(result => reply(result))
    .catch(e => reply(e))
}

exports.getByName = (request, reply) => {
  Account.getByName(request.params.name)
    .then(getPosition)
    .then(result => reply(result))
    .catch(e => reply(e))
}
