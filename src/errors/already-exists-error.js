'use strict'

const Shared = require('@leveloneproject/central-services-shared')
const BaseError = Shared.BaseError
const ErrorCategory = Shared.ErrorCategory

class AlreadyExistsError extends BaseError {
  constructor () {
    super(ErrorCategory.UNPROCESSABLE, 'The specified entity already exists and may not be modified.')
  }
}

module.exports = AlreadyExistsError

