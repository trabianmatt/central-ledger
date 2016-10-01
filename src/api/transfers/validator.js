'use strict'

const Config = require('../../lib/config')
const UrlParser = require('../../lib/urlparser')
const Accounts = require('../../models/accounts')
const P = require('bluebird')
const ValidationError = require('../../errors/validation-error')

exports.validate = (transfer, transferId) => {
  return new P((resolve, reject) => {
    if (!transfer) reject(new ValidationError('Transfer must be provided'))
    let id = UrlParser.idFromTransferUri(transfer.id)
    if (!id || id !== transferId) reject(new ValidationError('transfer.id: Invalid URI'))
    if (transfer.ledger !== Config.HOSTNAME) reject(new ValidationError('transfer.ledger is not valid for this ledger'))

    let credits = (transfer.credits || []).map(c => UrlParser.nameFromAccountUri(c.account)).map((c, i) => {
      if (!c) reject(new ValidationError(`transfer.credits[${i}].account: Invalid URI`))
      return c
    })
    let debits = (transfer.debits || []).map(d => UrlParser.nameFromAccountUri(d.account)).map((d, i) => {
      if (!d) reject(new ValidationError(`transfer.debits[${i}].account: Invalid URI`))
      return d
    })
    resolve([...credits, ...debits])
  })
  .then(accountNames => {
    return P.all(accountNames.map(n => {
      return Accounts.getByName(n).then(a => { if (a) { return a } else { throw new ValidationError('Account not found') } })
    }))
  })
  .then(a => {
    return transfer
  })
}
