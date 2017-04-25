'use strict'

const JWT = require('../../domain/security/jwt')
const Logger = require('../../lib/logger')

const create = (request, reply) => {
  Logger.info('AdminTokens.create Request: %s', request)

  JWT.create(request.payload.key)
    .then(token => reply({ token }))
    .catch(reply)
}

module.exports = {
  create
}
