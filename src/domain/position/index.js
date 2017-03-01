'use strict'

const _ = require('lodash')
const Decimal = require('decimal.js')
const UrlParser = require('../../lib/urlparser')
const PositionCalculator = require('./position-calculator')
const Account = require('../../domain/account')
const Fee = require('../../domain/fee')
const SettleableTransfersReadmodel = require('../../models/settleable-transfers-read-model')
const P = require('bluebird')

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

const mapFeeToExecuted = (fee) => {
  return {
    account: fee.account,
    debitAmount: fee.payerAmount,
    creditAmount: fee.payeeAmount,
    debitAccountName: fee.payerAccountName,
    creditAccountName: fee.payeeAccountName
  }
}

const calculatePositions = (executed, positionMap) => {
  if (executed.length === 0) {
    return positionMap
  } else {
    const head = executed[0]
    const tail = (executed.length > 1) ? executed.slice(1) : []

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
  const transferPositionMap = new Map().set(accountUri, buildEmptyPosition())
  const feePositionMap = new Map().set(accountUri, buildEmptyPosition())

  return P.all([SettleableTransfersReadmodel.getSettleableTransfersByAccount(account.accountId), Fee.getSettleableFeesByAccount(account)]).then(([transfers, fees]) => {
    const transferPositions = buildResponse(calculatePositions(transfers, transferPositionMap)).find(x => x.account === accountUri)
    const feePositions = buildResponse(calculatePositions(fees.map(mapFeeToExecuted), feePositionMap)).find(x => x.account === accountUri)
    const transferAmount = new Decimal(transferPositions.net)
    const feeAmount = new Decimal(feePositions.net)

    delete transferPositions.account
    delete feePositions.account

    return {
      account: accountUri,
      fees: feePositions,
      transfers: transferPositions,
      net: transferAmount.plus(feeAmount).valueOf()
    }
  })
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
