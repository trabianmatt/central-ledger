'use strict'

const Model = require('./model')
const Handle = require('../../lib/handler')

var respond = (reply, statusCode) => {
  let code = statusCode || 200
  return (entity) => {
    if (entity) {
      reply(buildResponseSubscription(entity)).code(code)
      return entity
    }
  }
}

var buildResponseSubscription = (record) => {
  return {
    id: record.subscriptionUuid,
    url: record.url,
    created: record.createdDate
  }
}

exports.getSubscriptionById = function (request, reply) {
  Model.getById(request.params.id)
    .then(respond(reply))
    .then(Handle.notFound(reply))
    .catch(Handle.error(request, reply))
}

exports.createSubscription = function (request, reply) {
  Model.create(request.payload)
    .then(respond(reply, 201))
    .catch(Handle.error(request, reply))
}
