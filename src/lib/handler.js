'use strict'

const Boom = require('boom')

exports.error = (request, reply) => {
  return (err) => {
    request.server.log(['error'], err)
    reply(Boom.wrap(err))
  }
}

exports.badRequest = (reply, message) => {
  reply(Boom.badRequest(message))
}

exports.notFound = (reply) => {
  return (entity) => {
    if (!entity) {
      reply(Boom.notFound())
    } else {
      return entity
    }
  }
}
