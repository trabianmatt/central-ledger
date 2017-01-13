'use strict'

const P = require('bluebird')
const Decimal = require('decimal.js')
const Config = require('../../lib/config')
const UrlParser = require('../../lib/urlparser')
const Account = require('../../domain/account')
const ValidationError = require('../../errors/validation-error')
const Moment = require('moment')

const allowedScale = Config.AMOUNT.SCALE
const allowedPrecision = Config.AMOUNT.PRECISION

exports.validate = (transfer, transferId) => {
  return P.resolve().then(() => {
    if (!transfer) throw new ValidationError('Transfer must be provided')
    let id = UrlParser.idFromTransferUri(transfer.id)
    if (!id || id !== transferId) throw new ValidationError('transfer.id: Invalid URI')
    if (transfer.ledger !== Config.HOSTNAME) throw new ValidationError('transfer.ledger is not valid for this ledger')
    let expiresAt = Moment(transfer.expires_at)
    if (expiresAt.isBefore(Moment.utc())) throw new ValidationError(`expires_at date: ${expiresAt.toISOString()} has already expired.`)

    let credit = validateEntry(transfer.credits[0])
    let debit = validateEntry(transfer.debits[0])

    return Array.from(new Set([credit.accountName, debit.accountName]))
  })
  .then(accountNames => {
    return P.all(accountNames.map(n => {
      return Account.getByName(n).then(a => { if (a) { return a } else { throw new ValidationError(`Account ${n} not found`) } })
    }))
  })
  .then(accounts => transfer)
}

function validateEntry (entry) {
  let accountName = UrlParser.nameFromAccountUri(entry.account)
  if (!accountName) throw new ValidationError(`Invalid account URI: ${entry.account}`)

  let decimalAmount = new Decimal(entry.amount)

  if (decimalAmount.decimalPlaces() > allowedScale) {
    throw new ValidationError(`Amount ${entry.amount} exceeds allowed scale of ${allowedScale}`)
  }

  if (decimalAmount.precision(true) > allowedPrecision) {
    throw new ValidationError(`Amount ${entry.amount} exceeds allowed precision of ${allowedPrecision}`)
  }

  return { accountName, decimalAmount }
}
