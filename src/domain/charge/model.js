'use strict'

const Db = require('../../db')

exports.getAll = () => {
  return Db.connect().then(db => db.charges.findAsync({}, { order: 'name' }))
}

exports.create = (charge) => {
  return Db.connect()
    .then(db => {
      return db.charges.saveAsync(
        {
          name: charge.name,
          chargeType: charge.charge_type,
          rateType: charge.rate_type,
          rate: charge.rate,
          minimum: charge.minimum,
          maximum: charge.maximum,
          code: charge.code,
          isActive: charge.is_active
        })
    })
}
