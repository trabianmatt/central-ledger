'use strict'

const Glue = require('glue')
const manifest = require('./manifest')
const Db = require('./lib/db')

const composeOptions = { relativeTo: __dirname }

module.exports = new Promise((resolve, reject) => {
  var s
  Db.connect.then(db => {
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
