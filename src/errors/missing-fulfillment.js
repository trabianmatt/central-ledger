'use strict'

const NotFoundError = require('@leveloneproject/central-services-shared').NotFoundError

class MissingFulfillmentError extends NotFoundError {
  constructor (message = 'This transfer has not yet been fulfilled') {
    super(message)
  }
}

module.exports = MissingFulfillmentError
