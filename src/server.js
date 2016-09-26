'use strict'

const Glue = require('glue')
const manifest = require('./manifest')
const Db = require('./lib/db')
const Eventric = require('./lib/eventric')

const composeOptions = { relativeTo: __dirname }

module.exports = new Promise((resolve, reject) => {
  let s
  Db.connect().then(db => {
    // This is done here to replay all events through projections before starting the server.
    return Eventric.getContext()
  })
  .then(context => {
    return Glue.compose(manifest, composeOptions)
  })
  .then(server => {
    s = server
    return server.start()
  })
  .then(() => s.log('info', 'Server running at: ' + s.info.uri))
  .catch(err => {
    throw err
  })
})
