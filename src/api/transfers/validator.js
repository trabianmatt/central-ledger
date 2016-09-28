'use strict'

const Config = require('../../lib/config')
const Accounts = require('../../models/accounts')
const P = require('bluebird')
const ValidationError = require('../../errors/validation-error')

exports.validate = (transfer) => {
  return new P((resolve, reject) => {
    if (!transfer) reject(new ValidationError('Transfer must be provided'))
    if (transfer.ledger !== Config.HOSTNAME) reject(new ValidationError('transfer.ledger is not valid for this ledger'))
    let accountRegex = new RegExp(`${Config.HOSTNAME}\/accounts\/([A-Za-z0-9_]*)\/?`, 'i')
    let credits = (transfer.credits || []).map((c, i) => {
      let matches = c.account.match(accountRegex)
      if (!matches) reject(new ValidationError(`transfer.credits[${i}].account: Invalid URI`))
      return matches[1]
    })
    let debits = (transfer.debits || []).map((d, i) => {
      let matches = d.account.match(accountRegex)
      if (!matches) reject(new ValidationError(`transfer.debits[${i}].account: Invalid URI`))
      return matches[1]
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
