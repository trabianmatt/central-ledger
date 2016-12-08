'use strict'

const _ = require('lodash')
const Decimal = require('decimal.js')
const UrlParser = require('../../lib/urlparser')
const PositionCalculator = require('./position-calculator')
const Account = require('../../domain/account')
const SettleableTransfersReadmodel = require('../../models/settleable-transfers-read-model')

exports.calculateForAccount = (account) => {
  let accountUri = UrlParser.toAccountUri(account.name)
  let positionMap = new Map().set(accountUri, buildEmptyPosition())

  return SettleableTransfersReadmodel.getSettleableTransfersByAccount(account.accountId)
    .then(transfers => calculatePositions(transfers, positionMap))
    .then(buildResponse)
    .then(positions => positions.find(x => x.account === accountUri))
}

exports.calculateForAllAccounts = () => {
  return Account.getAll()
    .then(accounts => {
      if (!accounts || accounts.length === 0) return []

      let positionMap = new Map()
      accounts.forEach(a => {
        positionMap.set(UrlParser.toAccountUri(a.name), buildEmptyPosition())
      })

      return SettleableTransfersReadmodel.getSettleableTransfers()
        .then(transfers => calculatePositions(transfers, positionMap))
        .then(buildResponse)
    })
}

function calculatePositions (executedTransfers, positionMap) {
  if (executedTransfers.length === 0) {
    return positionMap
  } else {
    let head = executedTransfers[0]
    let tail = (executedTransfers.length > 1) ? executedTransfers.slice(1) : []

    let addToExistingPositionFor = function (key) {
      if (positionMap.has(key)) {
        return v => positionMap.set(key, PositionCalculator.sum(positionMap.get(key), v))
      } else {
        return v => positionMap.set(key, v)
      }
    }

    let debitAccount = UrlParser.toAccountUri(head.debitAccountName)
    let creditAccount = UrlParser.toAccountUri(head.creditAccountName)

    addToExistingPositionFor(debitAccount)(buildPosition(new Decimal(head.debitAmount), new Decimal('0'), (new Decimal(head.debitAmount)).times(-1)))
    addToExistingPositionFor(creditAccount)(buildPosition(new Decimal('0'), new Decimal(head.creditAmount), new Decimal(head.creditAmount)))

    return calculatePositions(tail, positionMap)
  }
}

function buildResponse (positionMap) {
  return Array.from(positionMap.keys()).sort().map(p => _.assign({ account: p }, _.forOwn(positionMap.get(p), (value, key, obj) => (obj[key] = value.toString()))))
}

function buildPosition (payments, receipts, net) {
  return {
    payments: payments,
    receipts: receipts,
    net: net
  }
}

function buildEmptyPosition () {
  return buildPosition(new Decimal('0'), new Decimal('0'), new Decimal('0'))
}
