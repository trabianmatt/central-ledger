'use strict'

const PositionService = require('../../services/position')

exports.perform = (request, reply) => {
  PositionService.calculateForAllAccounts()
    .then(positions => reply({ positions: positions }))
}
