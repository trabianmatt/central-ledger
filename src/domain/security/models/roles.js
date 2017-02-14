'use strict'

const Uuid = require('uuid4')
const Db = require('../../../db')

const remove = (roleId) => Db.connect().then(db => db.roles.destroyAsync({ roleId }))

const save = (role) => {
  const connect = Db.connect()
  if (!role.roleId) {
    role.roleId = Uuid()
    return connect.then(db => db.roles.insertAsync(role))
  } else {
    return connect.then(db => db.roles.updateAsync(role))
  }
}

const getAll = () => Db.connect().then(db => db.roles.findAsync({}))

const getById = (roleId) => Db.connect().then(db => db.roles.findOneAsync({ roleId }))

module.exports = {
  getAll,
  getById,
  remove,
  save
}
