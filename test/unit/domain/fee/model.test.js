'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Model = require(`${src}/domain/fee/model`)
const Db = require(`${src}/db`)

Test('fees model', modelTest => {
  let sandbox
  let dbConnection
  let dbMethodsStub

  let feesTable = 'fees'

  let setupDatabase = (methodStubs = dbMethodsStub) => {
    dbConnection.withArgs(feesTable).returns(methodStubs)
  }

  modelTest.beforeEach((t) => {
    sandbox = Sinon.sandbox.create()
    dbMethodsStub = {
      insert: sandbox.stub(),
      where: sandbox.stub()
    }
    sandbox.stub(Db, 'connect')
    dbConnection = sandbox.stub()
    Db.connect.returns(P.resolve(dbConnection))
    t.end()
  })

  modelTest.afterEach((t) => {
    sandbox.restore()
    t.end()
  })

  modelTest.test('getAllForTransfer should', getAllForTransferTest => {
    getAllForTransferTest.test('return exception if db.connect throws', test => {
      const error = new Error()
      Db.connect.returns(P.reject(error))

      Model.getAllForTransfer({transferUuid: '1234'})
        .then(() => {
          test.fail('Should have thrown error')
        })
        .catch(err => {
          test.equal(err, error)
          test.end()
        })
    })

    getAllForTransferTest.test('return exception if db query throws', test => {
      const error = new Error()

      dbMethodsStub.where.returns(P.reject(error))
      setupDatabase()

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

      dbMethodsStub.where.withArgs({ transferId: transfer.transferUuid }).returns(P.resolve(fees))
      setupDatabase()

      Model.getAllForTransfer(transfer)
        .then((found) => {
          test.equal(found, fees)
          test.end()
        })
    })

    getAllForTransferTest.end()
  })

  modelTest.test('create should', createTest => {
    createTest.test('save payload and return newly created fee', test => {
      const transferId = '1'
      const amount = '1.00'

      const fee = {
        transferId: transferId,
        amount: amount,
        payerAccountId: 1,
        payeeAccountId: 2,
        chargeId: 3
      }

      const payload = {
        transferId: transferId,
        amount: amount,
        payerAccountId: 1,
        payeeAccountId: 2,
        chargeId: 3
      }

      dbMethodsStub.insert.withArgs(payload, '*').returns(P.resolve([fee]))
      setupDatabase()

      Model.create(payload)
        .then(c => {
          test.equal(c, fee)
          test.end()
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

      const charge = { chargeId }
      const transfer = { transferUuid: transferId }

      dbMethodsStub.where.withArgs({ transferId: transfer.transferUuid, chargeId: charge.chargeId }).returns({ first: sandbox.stub().returns(P.resolve(fee)) })
      setupDatabase()

      Model.doesExist(charge, transfer)
        .then(existing => {
          test.equal(existing, fee)
          test.end()
        })
    })

    doesExist.end()
  })

  modelTest.end()
})

