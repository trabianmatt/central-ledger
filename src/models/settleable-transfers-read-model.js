'use strict'

const Db = require('../db')

exports.getSettleableTransfers = () => {
  return buildSettleableTransfersQuery()
}

exports.getSettleableTransfersByAccount = (accountId) => {
  return buildSettleableTransfersQuery().andWhere(q => q.where('t.creditAccountId', accountId).orWhere('t.debitAccountId', accountId))
}

const buildSettleableTransfersQuery = () => {
  return Db.executedTransfers()
    .leftJoin('settledTransfers AS st', 'executedTransfers.transferId', 'st.transferId')
    .innerJoin('transfers AS t', 'executedTransfers.transferId', 't.transferUuid')
    .innerJoin('accounts AS ca', 't.creditAccountId', 'ca.accountId')
    .innerJoin('accounts AS da', 't.debitAccountId', 'da.accountId')
    .whereNull('st.transferId')
    .distinct('executedTransfers.transferId AS transferId', 'ca.name AS creditAccountName', 'da.name AS debitAccountName', 't.creditAmount AS creditAmount', 't.debitAmount AS debitAmount')
}
