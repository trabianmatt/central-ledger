'use strict'

const JWT = require('../../domain/security/jwt')

const create = (request, reply) => {
  JWT.create(request.payload.key)
    .then(token => reply({ token }))
    .catch(reply)
}

module.exports = {
  create
}
