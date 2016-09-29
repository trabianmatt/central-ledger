'use strict'

function AlreadyPreparedError () {}
AlreadyPreparedError.prototype = Object.create(Error.prototype)
AlreadyPreparedError.prototype.name = 'AlreadyPreparedError'

module.exports = AlreadyPreparedError
