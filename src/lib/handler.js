'use strict'

const Boom = require('boom')
const NotFoundError = require('../errors/not-found-error')

exports.getResponse = (reply, buildResponse, options) => {
  return (entity) => {
    options = options || {}
    if (entity) {
      let response = reply(buildResponse(entity)).code(200)
      if (options.contentType) {
        response.type(options.contentType)
      }
      return null
    } else {
      throw new NotFoundError()
    }
  }
}

exports.createResponse = (reply, buildResponse) => {
  return (entity) => {
    reply(buildResponse(entity)).code(201)
    return null
  }
}

exports.error = (request, reply) => {
  return (e) => {
    request.server.log(['error'], e)
    reply(Boom.wrap(e))
    return null
  }
}

exports.badRequest = (reply, message) => {
  return (e) => {
    reply(Boom.badRequest(message))
    return null
  }
}

exports.notFound = (reply) => {
  return (e) => {
    reply(Boom.notFound())
    return null
  }
}

exports.unprocessableEntity = (reply, message) => {
  return (e) => {
    reply(Boom.badData(message || e.message))
    return null
  }
}
