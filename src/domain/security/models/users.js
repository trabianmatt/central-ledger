'use strict'

const Uuid = require('uuid4')
const Db = require('../../../db')

const usersTable = 'users'

const getAll = () => Db.connection(usersTable).select()

const getById = (userId) => Db.connection(usersTable).where({ userId }).first()

const getByKey = (key) => Db.connection(usersTable).where({ key }).first()

const remove = (userId) => Db.connection(usersTable).where({ userId }).del('*')

const save = (user) => {
  if (!user.userId) {
    user.userId = Uuid()
    return Db.connection(usersTable).insert(user, '*').then(inserted => inserted[0])
  } else {
    return Db.connection(usersTable).where({ userId: user.userId }).update(user, '*').then(updated => updated[0])
  }
}

module.exports = {
  getAll,
  getById,
  getByKey,
  remove,
  save
}
