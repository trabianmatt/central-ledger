'use strict'

const Model = require('./model')

const PERCENTAGE = 'percent'
const FLAT = 'flat'

function typeExists (rateType) {
  return rateType === PERCENTAGE || rateType === FLAT
}

function shouldQuote (charge, transaction) {
  return (transaction.amount >= charge.minimum || !charge.minimum) &&
         (transaction.amount <= charge.maximum || !charge.maximum) &&
         typeExists(charge.rateType)
}

function quoteAmount (charge, amount) {
  switch (charge.rateType) {
    case PERCENTAGE:
      return charge.rate * amount
    case FLAT:
      return charge.rate
  }
}

function chargeQuote (charge, amount) {
  return {
    name: charge.name,
    charge_type: charge.chargeType,
    code: charge.code,
    amount: quoteAmount(charge, amount)
  }
}

const create = (charge) => {
  return Model.create(charge)
}

const getAll = () => {
  return Model.getAll()
}

const quote = (transaction) => {
  return getAll().then(charges => charges.filter(charge => shouldQuote(charge, transaction))
                                          .map(charge => chargeQuote(charge, transaction.amount)))
}

module.exports = {
  create,
  getAll,
  quote
}
