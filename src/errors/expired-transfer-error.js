'use strict'

function ExpiredTransferError () {}
ExpiredTransferError.prototype = Object.create(Error.prototype)
ExpiredTransferError.prototype.name = 'ExpiredTransferError'
ExpiredTransferError.prototype.message = 'The provided entity is syntactically correct, but there is a generic semantic problem with it.'
module.exports = ExpiredTransferError
