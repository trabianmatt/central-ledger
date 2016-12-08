'use strict'

const Eventric = require('../../eventric')
const RejectionType = require('../../domain/transfer/rejection-type')

exports.prepare = (transfer) => {
  return Eventric.getContext().then(ctx => ctx.command('PrepareTransfer', transfer))
}

exports.fulfill = (fulfillment) => {
  return Eventric.getContext().then(ctx => ctx.command('FulfillTransfer', fulfillment))
}

exports.reject = ({id, rejection_reason}) => {
  let payload = { id: id, rejection_reason: rejection_reason }
  return Eventric.getContext().then(ctx => ctx.command('RejectTransfer', payload))
}

exports.expire = (id) => {
  let payload = { id: id, rejection_reason: RejectionType.EXPIRED }
  return Eventric.getContext().then(ctx => ctx.command('RejectTransfer', payload))
}

exports.settle = ({id, settlement_id}) => {
  return Eventric.getContext().then(ctx => ctx.command('SettleTransfer', {id, settlement_id}))
}
