'use strict'

const P = require('bluebird')
const ReadModel = require('../../models/transfers-read-model')
const Commands = require('../../commands/transfer')

exports.rejectExpired = () => {
  let rejections = ReadModel.findExpired()
  .then(expired => expired.map(x => Commands.expire(x.transferUuid)))
  return P.all(rejections).then(rejections => {
    return rejections.map(r => r.transfer.id)
  })
}
