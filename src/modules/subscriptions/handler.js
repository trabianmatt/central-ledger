'use strict'

const Boom = require('boom')
const Uuid = require('uuid4')

exports.getSubscriptionById = function (request, reply) {
  request.server.app.db.subscriptions.findOne({ subscriptionUuid: request.params.id, deleted: 0 }, function (err, subscription) {
    if (err) {
      request.server.log(['error'], err)
      return reply(Boom.wrap(err))
    }

    if (!subscription) {
      return reply(Boom.notFound())
    }

    reply(buildResponseSubscription(subscription))
  })
}

exports.createSubscription = function (request, reply) {
  request.server.app.db.subscriptions.save({
    subscriptionUuid: Uuid(),
    url: request.payload.url,
    secret: request.payload.secret
  },
  function (err, inserted) {
    if (err) {
      request.server.log(['error'], err)
      return reply(Boom.wrap(err))
    }

    reply(buildResponseSubscription(inserted)).code(201)
  })
}

function buildResponseSubscription (record) {
  return {
    id: record.subscriptionUuid,
    url: record.url,
    created: record.createdDate
  }
}
