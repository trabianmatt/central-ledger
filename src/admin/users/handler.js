'use strict'

const SecurityService = require('../../domain/security')

const create = (request, reply) => {
  SecurityService.createUser(request.payload)
    .then(reply)
    .catch(reply)
}

const getAll = (request, reply) => {
  SecurityService.getAllUsers()
    .then(reply)
    .catch(reply)
}

const getById = (request, reply) => {
  SecurityService.getUserById(request.params.id)
    .then(reply)
    .catch(reply)
}

const remove = (request, reply) => {
  SecurityService.deleteUser(request.params.id)
    .then(() => reply({}))
    .catch(reply)
}

const update = (request, reply) => {
  SecurityService.updateUser(request.params.id, request.payload)
    .then(reply)
    .catch(reply)
}

const getRoles = (request, reply) => {
  SecurityService.getUserRoles(request.params.id)
    .then(reply)
    .catch(reply)
}

const updateRoles = (request, reply) => {
  SecurityService.updateUserRoles(request.params.id, request.payload)
    .then(reply)
    .catch(reply)
}

module.exports = {
  create,
  remove,
  getAll,
  getById,
  getRoles,
  update,
  updateRoles
}
