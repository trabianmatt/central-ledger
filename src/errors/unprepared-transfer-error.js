'use strict'

function UnpreparedTransferError () {}
UnpreparedTransferError.prototype = Object.create(Error.prototype)
UnpreparedTransferError.prototype.name = 'UnpreparedTransferError'
UnpreparedTransferError.prototype.message = 'The provided entity is syntactically correct, but there is a generic semantic problem with it.'
module.exports = UnpreparedTransferError
