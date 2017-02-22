'use strict'

const DA = require('deasync-promise')
const Logger = require('@leveloneproject/central-services-shared').Logger
const FeeService = require('./index')

const initialize = (params, done) => {
  return done()
}

const handleTransferExecuted = (event) => {
  return DA(FeeService.generateFeesForTransfer(event)
        .catch(err => {
          Logger.error('Error handling TransferExecuted event', err)
        }))
}

module.exports = {
  initialize,
  handleTransferExecuted
}
