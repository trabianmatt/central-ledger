'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Model = require(`${src}/domain/fee/model`)
const Db = require(`${src}/db`)

Test('fees model', modelTest => {
  let sandbox

  function setupFeesDb (fees) {
    sandbox.stub(Db, 'connect').returns(P.resolve({ fees: fees }))
  }

  modelTest.beforeEach((t) => {
    sandbox = Sinon.sandbox.create()
    t.end()
  })

  modelTest.afterEach((t) => {
    sandbox.restore()
    t.end()
  })

  modelTest.test('getAllForTransfer should', getAllForTransferTest => {
    getAllForTransferTest.test('return exception if db.connect throws', test => {
      const error = new Error()
      sandbox.stub(Db, 'connect').returns(P.reject(error))

      Model.getAllForTransfer({transferUuid: '1234'})
        .then(() => {
          test.fail('Should have thrown error')
        })
        .catch(err => {
          test.equal(err, error)
          test.end()
        })
    })

    getAllForTransferTest.test('return exception if db.findAsync throws', test => {
      const error = new Error()
      const findAsync = function () { return P.reject(error) }
      setupFeesDb({ findAsync: findAsync })

      Model.getAllForTransfer({transferUuid: '1234'})
        .then(() => {
          test.fail('Should have thrown error')
        })
        .catch(err => {
          test.equal(err, error)
          test.end()
        })
    })

    getAllForTransferTest.test('return all fees ordered by feeId', test => {
      const feeId1 = '1'
      const feeId2 = '2'
      const fees = [{ feeId: feeId1 }, { feeId: feeId2 }]
      const transfer = {transferUuid: '1234'}
      const findAsync = Sinon.stub().returns(P.resolve(fees))
      setupFeesDb({ findAsync: findAsync })

      Model.getAllForTransfer(transfer)
        .then((found) => {
          test.equal(found, fees)
          test.deepEqual(findAsync.firstCall.args[0], {transferId: transfer.transferUuid})
          test.end()
        })
        .catch(err => {
          test.fail(err)
        })
    })

    getAllForTransferTest.end()
  })

  modelTest.test('create should', createTest => {
    createTest.test('save payload as new object', test => {
      const transferId = '1'
      const amount = '1.00'
      const fee = {
        transferId: transferId,
        amount: amount,
        payerAccountId: 1,
        payeeAccountId: 2,
        chargeId: 3
      }
      const saveAsync = Sinon.stub().returns(P.resolve(fee))
      setupFeesDb({ saveAsync: saveAsync })

      const payload = {
        transferId: transferId,
        amount: amount,
        payerAccountId: 1,
        payeeAccountId: 2,
        chargeId: 3
      }

      Model.create(payload)
        .then(() => {
          const saveAsyncArg = saveAsync.firstCall.args[0]
          test.equal(saveAsyncArg, payload)
          test.equal(saveAsyncArg.transferId, payload.transferId)
          test.equal(saveAsyncArg.amount, payload.amount)
          test.end()
        })
    })

    createTest.test('return newly created fee', test => {
      const feeId = '1'
      const fee = { feeId }
      const saveAsync = Sinon.stub().returns(P.resolve(fee))
      setupFeesDb({ saveAsync: saveAsync })

      Model.create({})
        .then(s => {
          test.equal(s, fee)
          test.end()
        })
        .catch(err => {
          test.fail(err)
        })
    })

    createTest.end()
  })

  modelTest.test('doesExist should', doesExist => {
    doesExist.test('return fee if it already exists', test => {
      const transferId = '1'
      const chargeId = '1'
      const amount = '1.00'
      const fee = { transferId, amount, chargeId }
      const findAsync = Sinon.stub().returns(P.resolve(fee))
      setupFeesDb({ findAsync: findAsync })

      const charge = { chargeId }
      const transfer = { transferUuid: transferId }

      Model.doesExist(charge, transfer)
        .then(() => {
          const findAsyncArg = findAsync.firstCall.args[0]
          test.equal(findAsyncArg.chargeId, charge.chargeId)
          test.equal(findAsyncArg.transferId, transfer.transferUuid)
          test.end()
        })
    })

    doesExist.end()
  })

  modelTest.end()
})

