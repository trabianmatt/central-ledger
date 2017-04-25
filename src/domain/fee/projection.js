'use strict'

const DA = require('deasync-promise')
const Logger = require('../../lib/logger')
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
