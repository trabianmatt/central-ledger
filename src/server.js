'use strict'

const Glue = require('glue')
const Manifest = require('./manifest')
const Db = require('./db')
const Eventric = require('./eventric')
const Logger = require('./lib/logger')
const Migrator = require('./lib/migrator')

const composeOptions = { relativeTo: __dirname }

// Migrations must run before connecting to the database, due to the way Massive loads all database objects on initialization.
// Eventric.getContext is called to replay all events through projections (creating the read-model) before starting the server.
module.exports = Migrator.migrate()
  .then(() => Db.connect())
  .then(() => Eventric.getContext())
  .then(() => Glue.compose(Manifest, composeOptions))
  .then(server => server.start().then(() => Logger.info('Server running at: %s', server.info.uri)))
