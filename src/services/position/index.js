'use strict'

const _ = require('lodash')
const Decimal = require('decimal.js')
const UrlParser = require('../../lib/urlparser')
const PositionCalculator = require('./position-calculator')
const Account = require('../../domain/account')
const SettleableTransfersReadmodel = require('../../models/settleable-transfers-read-model')

const buildPosition = (payments, receipts, net) => {
  return {
    payments: payments,
    receipts: receipts,
    net: net
  }
}

const buildEmptyPosition = () => {
  return buildPosition(new Decimal('0'), new Decimal('0'), new Decimal('0'))
}

const buildResponse = (positionMap) => {
  return Array.from(positionMap.keys()).sort().map(p => _.assign({ account: p }, _.forOwn(positionMap.get(p), (value, key, obj) => (obj[key] = value.toString()))))
}

const calculatePositions = (executedTransfers, positionMap) => {
  if (executedTransfers.length === 0) {
    return positionMap
  } else {
    const head = executedTransfers[0]
    const tail = (executedTransfers.length > 1) ? executedTransfers.slice(1) : []

    const addToExistingPositionFor = (key) => {
      if (positionMap.has(key)) {
        return v => positionMap.set(key, PositionCalculator.sum(positionMap.get(key), v))
      } else {
        return v => positionMap.set(key, v)
      }
    }

    const debitAccount = UrlParser.toAccountUri(head.debitAccountName)
    const creditAccount = UrlParser.toAccountUri(head.creditAccountName)

    addToExistingPositionFor(debitAccount)(buildPosition(new Decimal(head.debitAmount), new Decimal('0'), (new Decimal(head.debitAmount)).times(-1)))
    addToExistingPositionFor(creditAccount)(buildPosition(new Decimal('0'), new Decimal(head.creditAmount), new Decimal(head.creditAmount)))

    return calculatePositions(tail, positionMap)
  }
}

exports.calculateForAccount = (account) => {
  const accountUri = UrlParser.toAccountUri(account.name)
  const positionMap = new Map().set(accountUri, buildEmptyPosition())

  return SettleableTransfersReadmodel.getSettleableTransfersByAccount(account.accountId)
    .then(transfers => calculatePositions(transfers, positionMap))
    .then(buildResponse)
    .then(positions => positions.find(x => x.account === accountUri))
}

exports.calculateForAllAccounts = () => {
  return Account.getAll()
    .then(accounts => {
      if (!accounts || accounts.length === 0) {
        return []
      }

      const positionMap = new Map()
      accounts.forEach(a => {
        positionMap.set(UrlParser.toAccountUri(a.name), buildEmptyPosition())
      })

      return SettleableTransfersReadmodel.getSettleableTransfers()
        .then(transfers => calculatePositions(transfers, positionMap))
        .then(buildResponse)
    })
}
