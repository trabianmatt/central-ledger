'use strict'

const Uuid = require('uuid4')
const Db = require('../../../db')

const remove = (roleId) => Db.roles().where({ roleId: roleId }).del('*')

const save = (role) => {
  if (!role.roleId) {
    role.roleId = Uuid()
    return Db.roles().insert(role, '*').then(inserted => inserted[0])
  } else {
    return Db.roles().where({ roleId: role.roleId }).update(role, '*').then(updated => updated[0])
  }
}

const getAll = () => Db.roles().select()

const getById = (roleId) => Db.roles().where({ roleId: roleId }).first()

const addUserRole = (userRole) => Db.userRoles().insert(userRole, '*').then(inserted => inserted[0])

const getUserRoles = (userId) => {
  return Db.roles()
    .innerJoin('userRoles as ur', 'roles.roleId', 'ur.roleId')
    .where('ur.userId', userId)
    .select('roles.*')
}

const removeUserRoles = (userId) => Db.userRoles().where({ userId }).del('*')

module.exports = {
  addUserRole,
  getAll,
  getById,
  getUserRoles,
  remove,
  removeUserRoles,
  save
}
