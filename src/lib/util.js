'use strict'

const _ = require('lodash')

const omitNil = (object) => {
  return _.omitBy(object, _.isNil)
}

const omitBy = (object, predicate) => {
  return _.omitBy(object, predicate)
}

const assign = (target, source) => {
  return Object.assign(target, source)
}

const merge = (target, source) => {
  return Object.assign({}, target, source)
}

module.exports = {
  assign,
  merge,
  omitBy,
  omitNil
}
