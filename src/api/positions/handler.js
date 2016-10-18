'use strict'
const Decimal = require('decimal.js')

const TransfersReadModel = require('../../models/transfers-read-model')
const Handle = require('../../lib/handler')
const PositionCalculator = require('./position-calculator')

function buildResponse (positionFor) {
  let response = { positions: [] }
  for (const account of Array.from(positionFor.keys()).sort()) {
    response.positions.push(
      {
        account: account,
        payments: positionFor.get(account).payments.toString(),
        receipts: positionFor.get(account).receipts.toString(),
        net: positionFor.get(account).net.toString()
      }
    )
  }

  return response
}

function createPositionsHelper (executedTransfers, positionFor) {
  if (executedTransfers.length === 0) {
    return positionFor
  } else {
    let head = executedTransfers[0]
    let tail = (executedTransfers.length > 1) ? executedTransfers.slice(1) : []

    let addToExistingPositionFor = function (key) {
      if (positionFor.has(key)) {
        return v => positionFor.set(key, PositionCalculator.sum(positionFor.get(key), v))
      } else {
        return v => positionFor.set(key, v)
      }
    }

    addToExistingPositionFor(head.debitAccount)(
      {
        payments: new Decimal(head.debitAmount),
        receipts: new Decimal('0'),
        net: (new Decimal(head.debitAmount)).times(-1)
      }
    )

    addToExistingPositionFor(head.creditAccount)(
      {
        payments: new Decimal('0'),
        receipts: new Decimal(head.creditAmount),
        net: new Decimal(head.creditAmount)
      }
    )

    return createPositionsHelper(tail, positionFor)
  }
}

function createPositions (executedTransfers) {
  return createPositionsHelper(executedTransfers, new Map())
}

exports.perform = (request, reply) => {
  TransfersReadModel.getExecuted()
    .then(createPositions)
    .then(Handle.getResponse(reply, buildResponse))
}
