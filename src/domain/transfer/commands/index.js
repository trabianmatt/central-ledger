'use strict'

const Eventric = require('../../../eventric')

const prepare = (transfer) => {
  return Eventric.getContext().then(ctx => ctx.command('PrepareTransfer', transfer))
}

const fulfill = (fulfillment) => {
  return Eventric.getContext().then(ctx => ctx.command('FulfillTransfer', fulfillment))
}

const reject = (idAndReason) => {
  return Eventric.getContext().then(ctx => ctx.command('RejectTransfer', idAndReason))
}

const settle = ({id, settlement_id}) => {
  return Eventric.getContext().then(ctx => ctx.command('SettleTransfer', {id, settlement_id}))
}

module.exports = {
  fulfill,
  prepare,
  reject,
  settle
}
