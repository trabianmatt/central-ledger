'use strict'

const Db = require('../../db')

exports.create = (charge) => {
  return Db.charges.insert({
    name: charge.name,
    chargeType: charge.charge_type,
    rateType: charge.rate_type,
    rate: charge.rate,
    minimum: charge.minimum,
    maximum: charge.maximum,
    code: charge.code,
    isActive: charge.is_active,
    payer: charge.payer,
    payee: charge.payee
  })
}

function filterUndefined (fields) {
  for (var key in fields) {
    if (fields[key] === undefined) {
      delete fields[key]
    }
  }
  return fields
}

exports.update = (charge, payload) => {
  const fields = {
    name: payload.name,
    chargeType: payload.charge_type,
    minimum: payload.minimum,
    maximum: payload.maximum,
    code: payload.code,
    isActive: payload.is_active
  }
  return Db.charges.update({ chargeId: charge.chargeId }, filterUndefined(fields))
}

exports.getByName = (name) => {
  return Db.charges.findOne({ name })
}

exports.getAll = () => {
  return Db.charges.find({ isActive: true }, { order: 'name asc' })
}

exports.getAllSenderAsPayer = () => {
  return Db.charges.find({ payer: 'sender', isActive: true }, { order: 'name asc' })
}
