'use strict'

const Validator = require('./validator')
const Events = require('../../lib/events')

const sendMessage = (req, rep) => {
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
