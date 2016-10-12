'use strict'

function AlreadyExistsError () {}

AlreadyExistsError.prototype = Object.create(Error.prototype)
AlreadyExistsError.prototype.name = 'AlreadyExistsError'
AlreadyExistsError.prototype.message = 'The specified entity already exists and may not be modified.'
module.exports = AlreadyExistsError

