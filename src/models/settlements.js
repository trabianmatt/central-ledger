'use strict'

const Uuid = require('uuid4')
const Db = require('../db')

const settlementsTable = 'settlements'

exports.generateId = () => {
  return Uuid()
}

exports.create = (id) => {
  return Db.connect().then(db => db(settlementsTable).insert({ settlementId: id }, '*')).then(inserted => inserted[0])
}
