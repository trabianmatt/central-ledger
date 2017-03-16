'use strict'

const Db = require('../db')

exports.getSettleableTransfers = () => {
  return Db.executedTransfers.query(buildSettleableTransfersQuery)
}

exports.getSettleableTransfersByAccount = (accountId) => {
  return Db.executedTransfers.query(builder => {
    return buildSettleableTransfersQuery(builder).andWhere(q => q.where('t.creditAccountId', accountId).orWhere('t.debitAccountId', accountId))
  })
}

const buildSettleableTransfersQuery = (builder) => {
  return builder
    .leftJoin('settledTransfers AS st', 'executedTransfers.transferId', 'st.transferId')
    .innerJoin('transfers AS t', 'executedTransfers.transferId', 't.transferUuid')
    .innerJoin('accounts AS ca', 't.creditAccountId', 'ca.accountId')
    .innerJoin('accounts AS da', 't.debitAccountId', 'da.accountId')
    .whereNull('st.transferId')
    .distinct('executedTransfers.transferId AS transferId', 'ca.name AS creditAccountName', 'da.name AS debitAccountName', 't.creditAmount AS creditAmount', 't.debitAmount AS debitAmount')
}
