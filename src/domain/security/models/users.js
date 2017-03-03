'use strict'

const Uuid = require('uuid4')
const Db = require('../../../db')

const getAll = () => Db.users().select()

const getById = (userId) => Db.users().where({ userId }).first()

const getByKey = (key) => Db.users().where({ key }).first()

const remove = (userId) => Db.users().where({ userId }).del('*')

const save = (user) => {
  if (!user.userId) {
    user.userId = Uuid()
    return Db.users().insert(user, '*').then(inserted => inserted[0])
  } else {
    return Db.users().where({ userId: user.userId }).update(user, '*').then(updated => updated[0])
  }
}

module.exports = {
  getAll,
  getById,
  getByKey,
  remove,
  save
}
