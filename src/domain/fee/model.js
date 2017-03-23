'use strict'

const Db = require('../../db')

exports.create = (fee) => {
  return Db.fees.insert(fee)
}

exports.getAllForTransfer = (transfer) => {
  return Db.fees.find({ transferId: transfer.transferUuid })
}

exports.doesExist = (charge, transfer) => {
  return Db.fees.findOne({ transferId: transfer.transferUuid, chargeId: charge.chargeId })
}

exports.getSettleableFees = () => {
  return Db.executedTransfers.query(buildSettleableFeesQuery)
}

exports.getSettleableFeesByAccount = (account) => {
  return Db.executedTransfers.query(builder => {
    return buildSettleableFeesQuery(builder).andWhere(q => q.where('f.payerAccountId', account.accountId).orWhere('f.payeeAccountId', account.accountId))
  })
}

const buildSettleableFeesQuery = (builder) => {
  return builder
    .leftJoin('settledTransfers AS st', 'executedTransfers.transferId', 'st.transferId')
    .innerJoin('fees AS f', 'f.transferId', 'executedTransfers.transferId')
    .innerJoin('accounts AS pe', 'f.payeeAccountId', 'pe.accountId')
    .innerJoin('accounts AS pr', 'f.payerAccountId', 'pr.accountId')
    .whereNull('st.transferId')
    .distinct('f.feeId AS feeId', 'pe.name AS payeeAccountName', 'pr.name AS payerAccountName', 'f.amount AS payeeAmount', 'f.amount AS payerAmount')
}

