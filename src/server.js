'use strict'

const Config = require('./lib/config')
const Glue = require('glue')
const Massive = require('massive')
const manifest = require('./manifest')

const composeOptions = { relativeTo: __dirname }

module.exports = new Promise((resolve, reject) => {
  Glue.compose(manifest, composeOptions, (err, server) => {
    if (err) {
      server.log(['error', 'compose'], err)
      throw err
    }

    server.start((err) => {
      if (err) {
        server.log(['error', 'server'], err)
        throw err
      }

      server.app.db = Massive.connectSync({ connectionString: Config.DATABASE_URI })

      server.log('info', 'Server running at: ' + server.info.uri)
    })
  })
})
