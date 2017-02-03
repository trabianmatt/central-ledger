'use strict'

const Account = require('../../domain/account')
const UrlParser = require('../../lib/urlparser')

function entityItem ({name, createdDate, isDisabled}) {
  const link = UrlParser.toAccountUri(name)
  return {
    name,
    id: link,
    created: createdDate,
    is_disabled: isDisabled,
    '_links': {
      self: link
    }
  }
}

exports.getAll = (request, reply) => {
  Account.getAll()
    .then(results => results.map(entityItem))
    .then(result => reply(result))
    .catch(e => reply(e))
}

exports.update = (request, reply) => {
  Account.update(request.params.name, request.payload)
    .then(result => reply(entityItem(result)))
    .catch(e => reply(e))
}
