'use strict'

const Uuid = require('uuid4')
const Db = require('../../../db')

const usersTable = 'users'

const getAll = () => Db.connect().then(db => db(usersTable).select())

const getById = (userId) => Db.connect().then(db => db(usersTable).where({ userId }).first())

const remove = (userId) => Db.connect().then(db => db(usersTable).where({ userId }).del('*'))

const save = (user) => {
  const connect = Db.connect()
  if (!user.userId) {
    user.userId = Uuid()
    return connect.then(db => db(usersTable).insert(user, '*')).then(inserted => inserted[0])
  } else {
    return connect.then(db => db(usersTable).where({ userId: user.userId }).update(user, '*')).then(updated => updated[0])
  }
}

module.exports = {
  getAll,
  getById,
  remove,
  save
}
