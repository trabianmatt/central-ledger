'use strict'

const handler = require('./handler')

exports.register = function (server, options, next) {
  server.route({
    method: 'POST',
    path: '/subscriptions',
    handler: handler.createSubscription
  })

  next()
}

exports.register.attributes = {
  name: 'subscriptions'
}
