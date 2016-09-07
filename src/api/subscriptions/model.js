'use strict'

const Db = require('../../lib/db')
const Uuid = require('uuid4')

exports.getById = (id) => {
  return Db.connect().then(db => db.subscriptions.findOneAsync({ subscriptionUuid: id, deleted: 0 }))
}

exports.create = (subscription) => {
  return Db.connect()
    .then(db => db.subscriptions.saveAsync(
      {
        subscriptionUuid: Uuid(),
        url: subscription.url,
        secret: subscription.secret
      })
    )
}
