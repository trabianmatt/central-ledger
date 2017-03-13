'use strict'

const Db = require('../../db')

exports.create = (charge) => {
  return Db.charges().insert({
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
  }, '*')
    .then(inserted => inserted[0])
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
  return Db.charges().where({ chargeId: charge.chargeId }).update(filterUndefined(fields), '*').then(updated => updated[0])
}

exports.getByName = (name) => {
  return Db.charges().where({ name: name }).first()
}

exports.getAll = () => {
  return Db.charges().where({ isActive: true }).orderBy('name', 'asc')
}

exports.getAllSenderAsPayer = () => {
  return Db.charges().where({ payer: 'sender' }).andWhere({ isActive: true }).orderBy('name', 'asc')
}
