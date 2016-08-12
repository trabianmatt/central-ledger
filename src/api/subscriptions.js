'use strict'

exports.register = function(server, options, next) {
  server.route({
    method: 'POST',
    path: '/subscriptions',
    handler: function (request, reply) {
      reply({ id: "12345" })
    }
  })

  next()
}

exports.register.attributes = {
  name: 'api/subscriptions'
}
