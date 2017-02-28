'use strict'

const Uuid = require('uuid4')
const Db = require('../../../db')

const rolesTable = 'roles'
const userRolesTable = 'userRoles'

const remove = (roleId) => Db.connect().then(db => db(rolesTable).where({ roleId: roleId }).del('*'))

const save = (role) => {
  const connect = Db.connect()
  if (!role.roleId) {
    role.roleId = Uuid()
    return connect.then(db => db(rolesTable).insert(role, '*')).then(inserted => inserted[0])
  } else {
    return connect.then(db => db(rolesTable).where({ roleId: role.roleId }).update(role, '*')).then(updated => updated[0])
  }
}

const getAll = () => Db.connect().then(db => db(rolesTable).select())

const getById = (roleId) => Db.connect().then(db => db(rolesTable).where({ roleId: roleId }).first())

const addUserRole = (userRole) => Db.connect().then(db => db(userRolesTable).insert(userRole, '*')).then(inserted => inserted[0])

const getUserRoles = (userId) => {
  return Db.connect()
    .then(db => {
      return db(`${rolesTable} AS r`)
        .innerJoin('userRoles as ur', 'r.roleId', 'ur.roleId')
        .where('ur.userId', userId)
        .select('r.*')
    })
}

const removeUserRoles = (userId) => Db.connect().then(db => db(userRolesTable).where({ userId }).del('*'))

module.exports = {
  addUserRole,
  getAll,
  getById,
  getUserRoles,
  remove,
  removeUserRoles,
  save
}
