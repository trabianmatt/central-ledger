'use strict'

const Uuid = require('uuid4')
const Db = require('../../../db')

const rolesTable = 'roles'

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

module.exports = {
  getAll,
  getById,
  remove,
  save
}
