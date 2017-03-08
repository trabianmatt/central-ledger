'use strict'

const Model = require('./model')
const Decimal = require('decimal.js')

const PERCENTAGE = 'percent'
const FLAT = 'flat'

function typeExists (rateType) {
  return rateType === PERCENTAGE || rateType === FLAT
}

function filterCharges (charge, amount) {
  amount = new Decimal(amount)

  return (!charge.minimum || amount.greaterThanOrEqualTo(charge.minimum)) &&
    (!charge.maximum || amount.lessThanOrEqualTo(charge.maximum)) &&
    typeExists(charge.rateType)
}

function quoteAmount (charge, amount) {
  switch (charge.rateType) {
    case PERCENTAGE:
      const rate = new Decimal(charge.rate)
      const transferAmount = new Decimal(amount)
      return rate.times(transferAmount).valueOf()
    case FLAT:
      return new Decimal(charge.rate).valueOf()
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

const getByName = (name) => {
  return Model.getByName(name)
}

const getAll = () => {
  return Model.getAll()
}

const getAllSenderAsPayer = () => {
  return Model.getAllSenderAsPayer()
}

const getAllForTransfer = (transfer) => {
  return getAll().then(charges => charges.filter(charge => filterCharges(charge, transfer.creditAmount)))
}

const quote = (transaction) => {
  return getAllSenderAsPayer().then(charges => charges.filter(charge => filterCharges(charge, transaction.amount))
    .map(charge => chargeQuote(charge, transaction.amount)))
}

module.exports = {
  create,
  getByName,
  getAll,
  getAllForTransfer,
  quote
}
