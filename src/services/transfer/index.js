'use strict'

const P = require('bluebird')
const ReadModel = require('../../models/transfers-read-model')
const Commands = require('../../commands/transfer')
const rejectionReason = 'expired'

exports.rejectExpired = () => {
  let rejections = ReadModel.findExpired()
  .then(expired => expired.map(x => Commands.reject({ id: x.transferUuid, rejection_reason: rejectionReason })))
  return P.all(rejections).then(rejections => {
    return rejections.map(r => r.transfer.id)
  })
}
