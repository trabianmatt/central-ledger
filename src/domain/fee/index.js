'use strict'

const Model = require('./model')
const Charges = require('../charge')
const TransferQueries = require('../transfer/queries')
const Util = require('../../../src/lib/util')

const PERCENTAGE = 'percent'
const FLAT = 'flat'
const SENDER = 'sender'
const RECEIVER = 'receiver'

const generateFeeAmount = (charge, transfer) => {
  switch (charge.rateType) {
    case PERCENTAGE:
      return Util.formatAmount(charge.rate * transfer.creditAmount)
    case FLAT:
      return charge.rate
  }
}

const getAccountIdFromTransferForCharge = (account, transfer) => {
  switch (account) {
    case SENDER:
      return transfer.debitAccountId
    case RECEIVER:
      return transfer.creditAccountId
  }
}

const doesExist = (charge, transfer) => {
  return Model.doesExist(charge, transfer)
}

const create = (charge, transfer) => {
  doesExist(charge, transfer).then(existingFee => {
    if (!existingFee) {
      const amount = generateFeeAmount(charge, transfer)
      const payerAccountId = getAccountIdFromTransferForCharge(charge.payer, transfer)
      const payeeAccountId = getAccountIdFromTransferForCharge(charge.payee, transfer)

      const fee = {
        transferId: transfer.transferUuid,
        amount,
        payerAccountId,
        payeeAccountId,
        chargeId: charge.chargeId
      }
      return Model.create(fee)
    }
    return existingFee
  })
}

const getAllForTransfer = (transfer) => {
  return Model.getAllForTransfer(transfer)
}

const generateFeesForTransfer = (event) => {
  return TransferQueries.getById(event.aggregate.id).then(transfer => {
    return Charges.getAllForTransfer(transfer).then(charges => charges.map(charge => create(charge, transfer)))
  })
}

module.exports = {
  getAllForTransfer,
  generateFeesForTransfer
}
