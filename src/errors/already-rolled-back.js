'use strict'

const Shared = require('@leveloneproject/central-services-shared')

class AlreadyRolledBackError extends Shared.BaseError {
  constructor (message = 'This transfer has already been rejected') {
    super(Shared.ErrorCategory.UNPROCESSABLE, message)
  }
}

module.exports = AlreadyRolledBackError
