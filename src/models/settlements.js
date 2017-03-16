'use strict'

const Uuid = require('uuid4')
const Db = require('../db')

exports.generateId = () => {
  return Uuid()
}

exports.create = (id) => {
  return Db.settlements.insert({ settlementId: id })
}
