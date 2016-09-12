'use strict'

function UnsupportedCryptoTypeError (message) {
  this.message = message
}
UnsupportedCryptoTypeError.prototype = Object.create(Error.prototype)
UnsupportedCryptoTypeError.prototype.name = 'UnsupportedCryptoTypeError'

module.exports = UnsupportedCryptoTypeError
