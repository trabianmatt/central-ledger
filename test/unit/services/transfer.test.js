'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const ReadModel = require('../../../src/models/transfers-read-model')
const Commands = require('../../../src/commands/transfer')
const Service = require('../../../src/services/transfer')

Test('Transfer Service tests', serviceTest => {
  let sandbox

  serviceTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(ReadModel, 'findExpired')
    sandbox.stub(Commands, 'reject')
    t.end()
  })

  serviceTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  serviceTest.test('rejectExpired should', rejectTest => {
    rejectTest.test('find expired transfers and reject them', test => {
      let transfers = [{ transferUuid: 1 }, { transferUuid: 2 }]
      ReadModel.findExpired.returns(P.resolve(transfers))
      transfers.forEach((x, i) => {
        Commands.reject.onCall(i).returns(P.resolve({ transfer: { id: x.transferUuid }, rejection_reason: 'expired' }))
      })
      Service.rejectExpired()
      .then(x => {
        transfers.forEach(t => {
          test.ok(Commands.reject.calledWith({ id: t.transferUuid, rejection_reason: 'expired' }))
        })
        test.deepEqual(x, transfers.map(t => t.transferUuid))
        test.end()
      })
    })
    rejectTest.end()
  })
  serviceTest.end()
})
