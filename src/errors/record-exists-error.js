'use strict'

function RecordExistsError () {}
RecordExistsError.prototype = Object.create(Error.prototype)
RecordExistsError.prototype.name = 'RecordExistsError'

module.exports = RecordExistsError
