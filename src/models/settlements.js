'use strict'

const Uuid = require('uuid4')
const Db = require('../db')

exports.generateId = () => {
  return Uuid()
}

exports.create = (id) => {
  return Db.connect()
  .then(db => db.settlements.insertAsync({settlementId: id}))
}
