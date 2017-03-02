'use strict'

const Db = require('../../db')

const feesTable = 'fees'

exports.create = (fee) => {
  return Db.connection(feesTable).insert(fee, '*').then(inserted => inserted[0])
}

exports.getAllForTransfer = (transfer) => {
  return Db.connection(feesTable).where({ transferId: transfer.transferUuid })
}

exports.doesExist = (charge, transfer) => {
  return Db.connection(feesTable).where({ transferId: transfer.transferUuid, chargeId: charge.chargeId }).first()
}

exports.getSettleableFeesByAccount = (account) => {
  return Db.connection('executedTransfers AS et')
    .leftJoin('settledTransfers AS st', 'et.transferId', 'st.transferId')
    .innerJoin('fees AS f', 'f.transferId', 'et.transferId')
    .innerJoin('accounts AS pe', 'f.payeeAccountId', 'pe.accountId')
    .innerJoin('accounts AS pr', 'f.payerAccountId', 'pr.accountId')
    .whereNull('st.transferId')
    .where(q => q.where('f.payerAccountId', account.accountId).orWhere('f.payeeAccountId', account.accountId))
    .distinct('f.feeId AS feeId', 'pe.name AS payeeAccountName', 'pr.name AS payerAccountName', 'f.amount AS payeeAmount', 'f.amount AS payerAmount')
}

