'use strict'

const Hapi = require('hapi')
const ErrorHandling = require('@leveloneproject/central-services-error-handling')
const P = require('bluebird')
const Migrator = require('../lib/migrator')
const Db = require('../db')
const Eventric = require('../eventric')
const Plugins = require('./plugins')

const runMigrations = () => Migrator.migrate()

const connectDatabase = () => Db.connect()

const startEventric = () => Eventric.getContext()

const createServer = (port, modules) => {
  return new P((resolve, reject) => {
    const server = new Hapi.Server()
    server.connection({
      port,
      routes: {
        validate: ErrorHandling.validateRoutes()
      }
    })
    Plugins.registerPlugins(server)
    server.register(modules)
    resolve(server)
  })
}

// Eventric.getContext is called to replay all events through projections (creating the read-model) before starting the server.
const initialize = (port, modules = [], loadEventric = false) => {
  return runMigrations()
  .then(connectDatabase)
  .then(() => {
    if (loadEventric) {
      return startEventric()
    } else {
      return P.resolve()
    }
  })
  .then(() => createServer(port, modules))
}

module.exports = {
  initialize,
  createServer
}
