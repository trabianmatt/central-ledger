'use strict'

const _ = require('lodash')
const Config = require('./config')

const omitNil = (object) => {
  return _.omitBy(object, _.isNil)
}

const pick = (object, properties) => {
  return _.pick(object, properties)
}

const assign = (target, source) => {
  return Object.assign(target, source)
}

const merge = (target, source) => {
  return Object.assign({}, target, source)
}

const mergeAndOmitNil = (target, source) => {
  return omitNil(merge(target, source))
}

const formatAmount = (amount) => {
  return Number(amount).toFixed(Config.AMOUNT.SCALE).toString()
}

module.exports = {
  assign,
  formatAmount,
  merge,
  mergeAndOmitNil,
  omitNil,
  pick
}
