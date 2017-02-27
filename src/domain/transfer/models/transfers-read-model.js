'use strict'

const Moment = require('moment')
const Db = require('../../../db')
const TransferState = require('../state')

const transfersTable = 'transfers'

const findExpired = (expirationDate) => {
  const expiresAt = (expirationDate || Moment.utc()).toISOString()
  return Db.connect().then(db => db(transfersTable).where({ state: TransferState.PREPARED }).andWhere('expiresAt', '<', expiresAt))
}

const saveTransfer = (record) => {
  return Db.connect().then(db => db(transfersTable).insert(record, '*')).then(inserted => inserted[0])
}

const updateTransfer = (transferId, fields) => {
  return Db.connect().then(db => db(transfersTable).where({ transferUuid: transferId }).update(fields, '*')).then(updated => updated[0])
}

const truncateTransfers = () => {
  return Db.connect().then(db => db(transfersTable).truncate())
}

const getById = (id) => {
  return Db.connect()
    .then(db => {
      return db(`${transfersTable} AS t`)
        .where({ transferUuid: id })
        .innerJoin('accounts AS ca', 't.creditAccountId', 'ca.accountId')
        .innerJoin('accounts AS da', 't.debitAccountId', 'da.accountId')
        .select('t.*', 'ca.name AS creditAccountName', 'da.name AS debitAccountName')
        .first()
    })
}

module.exports = {
  findExpired,
  saveTransfer,
  updateTransfer,
  truncateTransfers,
  getById
}
