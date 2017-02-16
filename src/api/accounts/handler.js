'use strict'

const Account = require('../../domain/account')
const Config = require('../../lib/config')
const UrlParser = require('../../lib/urlparser')
const Util = require('../../lib/util')
const PositionService = require('../../domain/position')
const Errors = require('../../errors')

const buildAccount = (account) => {
  return {
    id: UrlParser.toAccountUri(account.name),
    name: account.name,
    ledger: Config.HOSTNAME
  }
}

const buildResponse = (account, { net = '0' } = {}) => {
  return Util.mergeAndOmitNil(buildAccount(account), {
    created: account.createdDate,
    balance: net,
    is_disabled: account.isDisabled || false,
    credentials: account.credentials
  })
}

const handleExistingRecord = (entity) => {
  if (entity) {
    throw new Errors.RecordExistsError()
  }
  return entity
}

const handleMissingRecord = (entity) => {
  if (!entity) {
    throw new Errors.NotFoundError('The requested resource could not be found.')
  }
  return entity
}

const getPosition = (account) => {
  return PositionService.calculateForAccount(account)
    .then(handleMissingRecord)
    .then(position => buildResponse(account, position))
}

exports.create = (request, reply) => {
  Account.getByName(request.payload.name)
    .then(handleExistingRecord)
    .then(() => Account.create(request.payload))
    .then(account => reply(buildResponse(account)).code(201))
    .catch(reply)
}

exports.getByName = (request, reply) => {
  const accountName = request.params.name
  const credentials = request.auth.credentials
  const authenticated = (credentials && (credentials.is_admin || credentials.name === accountName))
  Account.getByName(request.params.name)
    .then(handleMissingRecord)
    .then(account => (authenticated ? getPosition(account) : buildAccount(account)))
    .then(reply)
    .catch(reply)
}
