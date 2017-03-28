'use strict'

const Db = require('../../db')

exports.create = (fee) => {
  return Db.fees.insert(fee)
}

exports.getAllForTransfer = (transfer) => {
  return Db.fees.find({ transferId: transfer.transferUuid })
}

exports.getSettleableFeesForTransfer = (transfer) => {
  return Db.fees.query(builder => {
    return buildSettleableFeesQuery(builder).where('fees.transferId', transfer)
  })
}

exports.doesExist = (charge, transfer) => {
  return Db.fees.findOne({ transferId: transfer.transferUuid, chargeId: charge.chargeId })
}

exports.getSettleableFees = () => {
  return Db.fees.query(buildSettleableFeesQuery)
}

exports.getSettleableFeesByAccount = (account) => {
  return Db.fees.query(builder => {
    return buildSettleableFeesQuery(builder).andWhere(q => q.where('fees.payerAccountId', account.accountId).orWhere('fees.payeeAccountId', account.accountId))
  })
}

const buildSettleableFeesQuery = (builder) => {
  return builder
    .leftJoin('settledFees AS sf', 'fees.feeId', 'sf.feeId')
    .innerJoin('accounts AS pe', 'fees.payeeAccountId', 'pe.accountId')
    .innerJoin('accounts AS pr', 'fees.payerAccountId', 'pr.accountId')
    .whereNull('sf.feeId')
    .distinct('fees.feeId AS feeId', 'pe.name AS payeeAccountName', 'pr.name AS payerAccountName', 'fees.amount AS payeeAmount', 'fees.amount AS payerAmount')
}
