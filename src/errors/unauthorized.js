'use strict'

const Shared = require('@leveloneproject/central-services-shared')

class UnauthorizedError extends Shared.BaseError {
  constructor (message) {
    super(Shared.ErrorCategory.FORBIDDEN, message)
  }
}

module.exports = UnauthorizedError
