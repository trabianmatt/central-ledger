'use strict'

const Db = require('../db')

exports.getSettleableTransfers = () => {
  return buildSettleableTransfersQuery()
}

exports.getSettleableTransfersByAccount = (accountId) => {
  return buildSettleableTransfersQuery().andWhere(q => q.where('t.creditAccountId', accountId).orWhere('t.debitAccountId', accountId))
}

const buildSettleableTransfersQuery = () => {
  return Db.connection('executedTransfers AS et')
    .leftJoin('settledTransfers AS st', 'et.transferId', 'st.transferId')
    .innerJoin('transfers AS t', 'et.transferId', 't.transferUuid')
    .innerJoin('accounts AS ca', 't.creditAccountId', 'ca.accountId')
    .innerJoin('accounts AS da', 't.debitAccountId', 'da.accountId')
    .whereNull('st.transferId')
    .distinct('et.transferId AS transferId', 'ca.name AS creditAccountName', 'da.name AS debitAccountName', 't.creditAmount AS creditAmount', 't.debitAmount AS debitAmount')
}
