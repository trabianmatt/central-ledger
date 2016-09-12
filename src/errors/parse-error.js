'use strict'

function ParseError (message) {
  this.message = message
}
ParseError.prototype = Object.create(Error.prototype)
ParseError.prototype.name = 'ParseError'

module.exports = ParseError
