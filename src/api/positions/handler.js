'use strict'

const PositionService = require('../../domain/position')

exports.perform = (request, reply) => {
  PositionService.calculateForAllAccounts()
    .then(positions => reply({ positions: positions }))
}
