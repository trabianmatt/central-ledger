'use strict'

function UnpreparedTransferError () {}
UnpreparedTransferError.prototype = Object.create(Error.prototype)
UnpreparedTransferError.prototype.name = 'UnpreparedTransferError'

module.exports = UnpreparedTransferError
