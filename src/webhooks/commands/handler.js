'use strict'

const Service = require('../../services/transfer')
const Handle = require('../../lib/handler')

exports.rejectExpired = function (request, reply) {
  return Service.rejectExpired()
  .then(Handle.getResponse(reply, x => x))
  .catch(Handle.error(request, reply))
}
