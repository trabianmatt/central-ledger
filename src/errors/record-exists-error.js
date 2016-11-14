'use strict'

const Shared = require('@leveloneproject/central-services-shared')
const BaseError = Shared.BaseError
const ErrorCategory = Shared.ErrorCategory

class RecordExistsError extends BaseError {
  constructor (message = 'The account has already been registered') {
    super(ErrorCategory.UNPROCESSABLE, message)
  }
}

module.exports = RecordExistsError
