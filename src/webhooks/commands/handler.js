'use strict'

const Service = require('../../services/transfer')

exports.rejectExpired = function (request, reply) {
  return Service.rejectExpired()
  .then(response => reply(response))
  .catch(e => reply(e))
}

exports.settle = function (request, reply) {
  return Service.settle()
  .then(response => reply(response))
  .catch(e => reply(e))
}
