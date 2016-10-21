'use strict'

const NotFoundError = require('../errors/not-found-error')
const SchemaValidationError = require('../errors/schema-validation-error')

let getResponse = (reply, buildResponse, options) => {
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

let putResponse = (reply, buildResponse) => {
  return (entity) => {
    reply(buildResponse(entity)).code((entity.existing === true) ? 200 : 201)
    return null
  }
}

let createResponse = (reply, buildResponse) => {
  return (entity) => {
    reply(buildResponse(entity)).code(201)
    return null
  }
}

let error = (request, reply) => {
  return (e) => {
    let body = {
      'id': 'InternalServerError',
      'message': 'The server encountered an unexpected condition which prevented it from fulfilling the request.'
    }

    request.server.log(['error'], e)
    reply(body).code(500)
    return null
  }
}

let badRequest = (reply) => {
  return (e) => {
    let body = {
      'id': e.id || 'InvalidBodyError',
      'message': e.message || 'The submitted JSON entity does not match the required schema.'
    }

    if (e.validationErrors) body.validationErrors = e.validationErrors

    reply(body).code(400)
    return null
  }
}

let notFound = (reply) => {
  return (e) => {
    let body = {
      'id': e.id || 'NotFoundError',
      'message': e.originalErrorMessage || e.message || 'The requested resource could not be found.'
    }

    reply(body).code(404)
    return null
  }
}

let unprocessableEntity = (reply, message) => {
  return (e) => {
    let body = {
      'id': e.id || 'UnprocessableEntityError',
      'message': message || e.originalErrorMessage || e.message || 'The provided entity is syntactically correct, but there is a generic semantic problem with it.'
    }

    reply(body).code(422)
    return null
  }
}

let failAction = function (request, reply, source, error) {
  return badRequest(reply)(new SchemaValidationError(error.data.details))
}

module.exports = {
  getResponse,
  putResponse,
  createResponse,
  error,
  badRequest,
  notFound,
  unprocessableEntity,
  failAction
}
