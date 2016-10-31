'use strict'

const Winston = require('winston')

let logger

exports.debug = (...args) => {
  log('debug', ...args)
}

exports.info = (...args) => {
  log('info', ...args)
}

exports.warn = (...args) => {
  log('warn', ...args)
}

exports.error = (...args) => {
  log('error', ...args)
}

function log (...args) {
  getLogger().log(...args)
}

function getLogger () {
  if (!logger) {
    logger = new Winston.Logger().add(Winston.transports.Console, { timestamp: true, colorize: true })
  }
  return logger
}
