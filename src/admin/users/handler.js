'use strict'

const SecurityService = require('../../domain/security')
const Logger = require('../../lib/logger')

const create = (request, reply) => {
  Logger.info('Users.create Request: %s', request)
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
  Logger.info('Users.remove Request: %s', request)
  SecurityService.deleteUser(request.params.id)
    .then(() => reply({}))
    .catch(reply)
}

const update = (request, reply) => {
  Logger.info('Users.update Request: %s', request)
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
  Logger.info('Users.updateRoles Request: %s', request)
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
