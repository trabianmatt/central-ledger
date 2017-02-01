'use strict'

const FiveBellsCondition = require('five-bells-condition')
const ValidationError = require('../errors/validation-error')

const validateCondition = (conditionUri) => {
  try {
    return FiveBellsCondition.validateCondition(conditionUri)
  } catch (error) {
    throw new ValidationError(error.message)
  }
}

const validateFulfillment = (fulfillment, condition) => {
  try {
    return FiveBellsCondition.validateFulfillment(fulfillment, condition)
  } catch (error) {
    throw new ValidationError(error.message)
  }
}

module.exports = {
  validateCondition,
  validateFulfillment
}
