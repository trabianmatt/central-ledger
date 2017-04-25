'use strict'

const Logger = require('../lib/logger')
const Config = require('../lib/config')
const Routes = require('./routes')
const Auth = require('./auth')

const Setup = require('../shared/setup')

module.exports = Setup.initialize({ port: Config.ADMIN_PORT, modules: [Auth, Routes] })
  .then(server => server.start().then(() => {
    Logger.info('Server running at: %s', server.info.uri)
  }))
