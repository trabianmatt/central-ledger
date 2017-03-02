'use strict'

const Logger = require('@leveloneproject/central-services-shared').Logger

const Config = require('../lib/config')
const Routes = require('./routes')
const Auth = require('./auth')
const Sockets = require('./sockets')
const Worker = require('./worker')
const Account = require('../domain/account')

const Setup = require('../shared/setup')

module.exports = Setup.initialize(Config.PORT, [Auth, Routes, Sockets, Worker], true)
  .then(server => {
    return Account.createLedgerAccount(Config.LEDGER_ACCOUNT_NAME, Config.LEDGER_ACCOUNT_PASSWORD).then(() => server)
  })
  .then(server => server.start().then(() => {
    Logger.info('Server running at: %s', server.info.uri)
  }))
