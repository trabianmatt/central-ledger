'use strict'

const Uuid = require('uuid4')
const Db = require('../../../db')

const rolesTable = 'roles'
const userRolesTable = 'userRoles'

const remove = (roleId) => Db.connection(rolesTable).where({ roleId: roleId }).del('*')

const save = (role) => {
  if (!role.roleId) {
    role.roleId = Uuid()
    return Db.connection(rolesTable).insert(role, '*').then(inserted => inserted[0])
  } else {
    return Db.connection(rolesTable).where({ roleId: role.roleId }).update(role, '*').then(updated => updated[0])
  }
}

const getAll = () => Db.connection(rolesTable).select()

const getById = (roleId) => Db.connection(rolesTable).where({ roleId: roleId }).first()

const addUserRole = (userRole) => Db.connection(userRolesTable).insert(userRole, '*').then(inserted => inserted[0])

const getUserRoles = (userId) => {
  return Db.connection(`${rolesTable} AS r`)
    .innerJoin('userRoles as ur', 'r.roleId', 'ur.roleId')
    .where('ur.userId', userId)
    .select('r.*')
}

const removeUserRoles = (userId) => Db.connection(userRolesTable).where({ userId }).del('*')

module.exports = {
  addUserRole,
  getAll,
  getById,
  getUserRoles,
  remove,
  removeUserRoles,
  save
}
