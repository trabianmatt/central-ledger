'use strict'

const Validator = require('./validator')
const Events = require('../../lib/events')
const Logger = require('../../lib/logger')

const sendMessage = (req, rep) => {
  Logger.info('Messages.sendMessage request: %s', req)
  return Validator.validate(req.payload)
    .then(message => {
      Events.sendMessage(message)
      rep().code(201)
    })
    .catch(e => rep(e))
}

module.exports = {
  sendMessage
}
