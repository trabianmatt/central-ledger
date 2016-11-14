'use strict'

const Shared = require('@leveloneproject/central-services-shared')
const BaseError = Shared.BaseError
const ErrorCategory = Shared.ErrorCategory

class ParseError extends BaseError {
  constructor (message) {
    super(ErrorCategory.UNPROCESSABLE, message)
  }
}

module.exports = ParseError
