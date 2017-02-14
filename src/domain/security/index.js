'use strict'

const Errors = require('../../errors')
const Util = require('../../lib/util')
const RolesModel = require('./models/roles')

const expandRole = (role) => {
  return Util.mergeAndOmitNil(role, { permissions: Util.expand(role.permissions), createdDate: null })
}

const compactRole = (role) => {
  return Util.mergeAndOmitNil(role, { permissions: Util.squish(role.permissions) })
}

const getAllRoles = () => RolesModel.getAll().map(expandRole)

const createRole = (role) => {
  return RolesModel.save(compactRole(role))
    .then(expandRole)
}

const deleteRole = (roleId) => {
  return RolesModel.remove(roleId)
    .then(results => {
      if (!results || results.length === 0) {
        throw new Errors.NotFoundError('Role does not exist')
      }
      return results
    })
}

const updateRole = (roleId, newRole) => {
  return RolesModel.getById(roleId)
    .then(existing => {
      if (!existing) {
        throw new Errors.NotFoundError('Role does not exist')
      }
      return RolesModel.save(compactRole(Util.merge(existing, newRole)))
        .then(expandRole)
    })
}

module.exports = {
  createRole,
  deleteRole,
  getAllRoles,
  updateRole
}
