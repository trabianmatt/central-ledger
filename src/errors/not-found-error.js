'use strict'

function NotFoundError () {}
NotFoundError.prototype = Object.create(Error.prototype)
NotFoundError.prototype.name = 'NotFoundError'

module.exports = NotFoundError
