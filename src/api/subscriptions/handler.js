'use strict'

const Model = require('./model')
const Handle = require('../../lib/handler')
const NotFoundError = require('../../errors/not-found-error')

function buildResponseSubscription (record) {
  return {
    id: record.subscriptionUuid,
    url: record.url,
    created: record.createdDate
  }
}

exports.getSubscriptionById = function (request, reply) {
  Model.getById(request.params.id)
    .then(Handle.getResponse(reply, buildResponseSubscription))
    .catch(NotFoundError, Handle.notFound(reply))
    .catch(Handle.error(request, reply))
}

exports.createSubscription = function (request, reply) {
  Model.create(request.payload)
    .then(Handle.createResponse(reply, buildResponseSubscription))
    .catch(Handle.error(request, reply))
}
