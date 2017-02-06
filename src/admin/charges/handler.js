'use strict'

const Charges = require('../../domain/charge')

function entityItem (charge) {
  return {
    name: charge.name,
    id: charge.chargeId,
    charge_type: charge.chargeType,
    rate_type: charge.rateType,
    rate: charge.rate,
    minimum: charge.minimum,
    maximum: charge.maximum,
    code: charge.code,
    is_active: charge.isActive,
    created: charge.createdDate
  }
}

exports.create = (request, reply) => {
  Charges.create(request.payload)
    .then(result => reply(entityItem(result)).code(201))
    .catch(e => reply(e))
}

exports.getAll = (request, reply) => {
  Charges.getAll()
    .then(results => results.map(entityItem))
    .then(result => reply(result))
    .catch(e => reply(e))
}
