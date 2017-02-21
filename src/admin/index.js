'use strict'

const Logger = require('@leveloneproject/central-services-shared').Logger

const Config = require('../lib/config')
const Routes = require('./routes')
const Auth = require('./auth')

const Setup = require('../shared/setup')

module.exports = Setup.initialize(Config.ADMIN_PORT, [Auth, Routes])
  .then(server => server.start().then(() => {
    Logger.info('Server running at: %s', server.info.uri)
  }))
