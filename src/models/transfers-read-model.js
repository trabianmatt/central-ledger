'use strict'

const _ = require('lodash')
const Moment = require('moment')
const Db = require('../db')
const TransferState = require('../domain/transfer/state')

exports.getTransfersByState = (transferState) => {
  return Db.connect().then(db => db.getTransfersByStateAsync(transferState))
}

exports.findExpired = (expirationDate) => {
  const expiresAt = (expirationDate || Moment.utc()).toISOString()
  return Db.connect().then(db => db.transfers.findAsync({ state: TransferState.PREPARED, 'expiresAt <': expiresAt }))
}

exports.saveTransfer = (record) => {
  return Db.connect().then(db => db.transfers.insertAsync(record))
}

exports.updateTransfer = (transferId, fields) => {
  return Db.connect().then(db => db.transfers.updateAsync(_.assign({ transferUuid: transferId }, fields)))
}

exports.truncateTransfers = () => {
  return Db.connect().then(db => db.transfers.destroyAsync({}))
}

exports.getById = (id) => {
  return Db.connect().then(db => db.getTransferByIdAsync(id)).then(retrieved => retrieved[0])
}
