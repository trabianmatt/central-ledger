'use strict'

const Model = require('./model')

const create = (charge) => {
  return Model.create(charge)
}

const getAll = () => {
  return Model.getAll()
}

module.exports = {
  create,
  getAll
}
