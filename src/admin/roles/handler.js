'use strict'

const SecurityService = require('../../domain/security')

const getRoles = (request, reply) => {
  SecurityService.getAllRoles()
    .then(reply)
    .catch(reply)
}

const createRole = (request, reply) => {
  SecurityService.createRole(request.payload)
    .then(reply)
    .catch(reply)
}

const updateRole = (request, reply) => {
  SecurityService.updateRole(request.params.id, request.payload)
    .then(reply)
    .catch(reply)
}

const deleteRole = (request, reply) => {
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
