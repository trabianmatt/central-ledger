'use strict'

const _ = require('lodash')
const Moment = require('moment')
const Db = require('../../../db')
const TransferState = require('../state')

const findExpired = (expirationDate) => {
  const expiresAt = (expirationDate || Moment.utc()).toISOString()
  return Db.connect().then(db => db.transfers.findAsync({ state: TransferState.PREPARED, 'expiresAt <': expiresAt }))
}

const saveTransfer = (record) => {
  return Db.connect().then(db => db.transfers.insertAsync(record))
}

const updateTransfer = (transferId, fields) => {
  return Db.connect().then(db => db.transfers.updateAsync(_.assign({ transferUuid: transferId }, fields)))
}

const truncateTransfers = () => {
  return Db.connect().then(db => db.transfers.destroyAsync({}))
}

const getById = (id) => {
  return Db.connect().then(db => db.getTransferByIdAsync(id)).then(retrieved => retrieved[0])
}

module.exports = {
  findExpired,
  saveTransfer,
  updateTransfer,
  truncateTransfers,
  getById
}
