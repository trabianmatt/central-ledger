'use strict'

const SecurityService = require('../../domain/security')
const Logger = require('../../lib/logger')

const getRoles = (request, reply) => {
  SecurityService.getAllRoles()
    .then(reply)
    .catch(reply)
}

const createRole = (request, reply) => {
  Logger.info('Roles.createRole Request: %s', request)
  SecurityService.createRole(request.payload)
    .then(reply)
    .catch(reply)
}

const updateRole = (request, reply) => {
  Logger.info('Roles.updateRole Request: %s', request)
  SecurityService.updateRole(request.params.id, request.payload)
    .then(reply)
    .catch(reply)
}

const deleteRole = (request, reply) => {
  Logger.info('Roles.deleteRole Request: %s', request)
  SecurityService.deleteRole(request.params.id)
    .then(() => reply().code(204))
    .catch(reply)
}

module.exports = {
  createRole,
  deleteRole,
  getRoles,
  updateRole
}
