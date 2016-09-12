'use strict'

function ValidationError (message) {
  this.message = message
}
ValidationError.prototype = Object.create(Error.prototype)
ValidationError.prototype.name = 'ValidationError'

module.exports = ValidationError
