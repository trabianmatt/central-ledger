'use strict'

function SchemaValidationError (details) {
  this.validationErrors = details.map(d => ({ message: d.message, path: d.path }))
}
SchemaValidationError.prototype = Object.create(Error.prototype)
SchemaValidationError.prototype.name = 'SchemaValidationError'
SchemaValidationError.prototype.id = 'InvalidBodyError'

module.exports = SchemaValidationError
