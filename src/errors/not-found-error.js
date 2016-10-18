'use strict'

function NotFoundError () {}
NotFoundError.prototype = Object.create(Error.prototype)
NotFoundError.prototype.name = 'NotFoundError'
NotFoundError.prototype.message = 'The requested resource could not be found.'

module.exports = NotFoundError
