'use strict'

const Eventric = require('../../eventric')

exports.prepare = (transfer) => {
  return Eventric.getContext().then(ctx => ctx.command('PrepareTransfer', transfer))
}

exports.fulfill = (fulfillment) => {
  return Eventric.getContext().then(ctx => ctx.command('FulfillTransfer', fulfillment))
}

exports.reject = (rejection) => {
  return Eventric.getContext().then(ctx => ctx.command('RejectTransfer', rejection))
}
