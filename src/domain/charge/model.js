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

exports.getByName = (name) => {
  return Db.charges().where({ name: name }).first()
}

exports.getAll = () => {
  return Db.charges().orderBy('name', 'asc')
}

exports.getAllSenderAsPayer = () => {
  return Db.charges().where({ payer: 'sender' }).orderBy('name', 'asc')
}
