'use strict'

const Db = require('../../lib/db')
const Uuid = require('uuid4')

exports.getByIdentifier = (identifier) => {
  return Db.connect.then(db => db.registrations.findOneAsync({ identifier: identifier }))
}

exports.create = (registration) => {
  return Db.connect
    .then(db => db.registrations.saveAsync(
      {
        registrationUuid: Uuid(),
        identifier: registration.identifier,
        name: registration.name
      })
    )
}
