'use strict'

const Handle = require('../../lib/handler')
const PositionService = require('../../services/position')

exports.perform = (request, reply) => {
  PositionService.calculateForAllAccounts()
    .then(Handle.getResponse(reply, (positions) => { return { positions: positions } }))
}
