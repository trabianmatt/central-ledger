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
  let executedTransfersTable = 'executedTransfers AS et'

  let setupDatabase = (methodStubs = dbMethodsStub) => {
    dbConnection.withArgs(feesTable).returns(methodStubs)
    dbConnection.withArgs(executedTransfersTable).returns(methodStubs)
  }

  modelTest.beforeEach((t) => {
    sandbox = Sinon.sandbox.create()
    dbMethodsStub = {
      insert: sandbox.stub(),
      where: sandbox.stub(),
      leftJoin: sandbox.stub()
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

      Model.getAllForTransfer({ transferUuid: '1234' })
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

      Model.getAllForTransfer({ transferUuid: '1234' })
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
      const transfer = { transferUuid: '1234' }

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

  modelTest.test('getSettleableFeesByAccount should', getSettleableFeesTest => {
    getSettleableFeesTest.test('return settleable fees for account', test => {
      const transferId = '1'
      const chargeId = '1'
      const amount = '1.00'
      const fees = [{ transferId, amount, chargeId }]

      const account = { accountId: 11 }

      let joinFeesStub = sandbox.stub()
      let joinPayerStub = sandbox.stub()
      let joinPayeeStub = sandbox.stub()
      let whereNullStub = sandbox.stub()
      let distinctStub = sandbox.stub()
      let whereStub = sandbox.stub()

      let groupStub = sandbox.stub()
      let groupWhereStub = sandbox.stub()
      let groupOrWhereStub = sandbox.stub()

      groupStub.where = groupWhereStub.returns({ orWhere: groupOrWhereStub })
      whereStub.callsArgWith(0, groupStub)

      dbMethodsStub.leftJoin.returns({
        innerJoin: joinFeesStub.returns({
          innerJoin: joinPayerStub.returns({
            innerJoin: joinPayeeStub.returns({
              whereNull: whereNullStub.returns({
                where: whereStub.returns({
                  distinct: distinctStub.returns(P.resolve(fees))
                })
              })
            })
          })
        })
      })

      setupDatabase()

      Model.getSettleableFeesByAccount(account)
        .then(foundFee => {
          test.ok(dbMethodsStub.leftJoin.withArgs('settledTransfers AS st', 'et.transferId', 'st.transferId').calledOnce)
          test.ok(joinFeesStub.withArgs('fees AS f', 'f.transferId', 'et.transferId').calledOnce)
          test.ok(joinPayerStub.withArgs('accounts AS pe', 'f.payeeAccountId', 'pe.accountId').calledOnce)
          test.ok(joinPayeeStub.withArgs('accounts AS pr', 'f.payerAccountId', 'pr.accountId').calledOnce)
          test.ok(whereNullStub.withArgs('st.transferId').calledOnce)
          test.ok(distinctStub.withArgs('f.feeId AS feeId', 'pe.name AS payeeAccountName', 'pr.name AS payerAccountName', 'f.amount AS payeeAmount', 'f.amount AS payerAmount').calledOnce)

          test.equal(foundFee, fees)
          test.end()
        })
    })

    getSettleableFeesTest.end()
  })

  modelTest.end()
})
