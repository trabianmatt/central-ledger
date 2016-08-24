'use strict'

const Glue = require('glue')
const Massive = require('massive')
const manifest = require('./manifest')

const composeOptions = { relativeTo: __dirname };

module.exports = new Promise((resolve, reject) => {
  Glue.compose(manifest, composeOptions, (err, server) => {
    if (err) {
      server.log(['error', 'plugins'], err)
      throw err
    }

    server.start((err) => {
      if (err) {
        server.log(['error', 'server'], err)
        throw err
      }

      server.app.db = Massive.connectSync({ connectionString: 'postgres://central_ledger:cVq8iFqaLuHy8jjKuA@localhost:5432/central_ledger' })

      server.log('info', 'Server running at: ' + server.info.uri)
    });
  });
});