'use strict'

const Moment = require('moment')
const Db = require('../../../db')
const TransferState = require('../state')

const findExpired = (expirationDate) => {
  const expiresAt = (expirationDate || Moment.utc()).toISOString()
  return Db.transfers().where({ state: TransferState.PREPARED }).andWhere('expiresAt', '<', expiresAt)
}

const saveTransfer = (record) => {
  return Db.transfers().insert(record, '*').then(inserted => inserted[0])
}

const updateTransfer = (transferId, fields) => {
  return Db.transfers().where({ transferUuid: transferId }).update(fields, '*').then(updated => updated[0])
}

const truncateTransfers = () => {
  return Db.transfers().truncate()
}

const getById = (id) => {
  return Db.transfers()
    .where({ transferUuid: id })
    .innerJoin('accounts AS ca', 'transfers.creditAccountId', 'ca.accountId')
    .innerJoin('accounts AS da', 'transfers.debitAccountId', 'da.accountId')
    .select('transfers.*', 'ca.name AS creditAccountName', 'da.name AS debitAccountName')
    .first()
}

module.exports = {
  findExpired,
  saveTransfer,
  updateTransfer,
  truncateTransfers,
  getById
}
