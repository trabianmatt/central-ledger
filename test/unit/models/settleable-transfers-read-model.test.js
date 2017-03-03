'use strict'

const src = '../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Model = require(`${src}/models/settleable-transfers-read-model`)
const Db = require(`${src}/db`)

Test('settleable-transfers-read-model', function (modelTest) {
  let sandbox
  let executedTransfersStubs

  modelTest.beforeEach((t) => {
    sandbox = Sinon.sandbox.create()

    executedTransfersStubs = {
      leftJoin: sandbox.stub()
    }

    Db.executedTransfers = sandbox.stub().returns(executedTransfersStubs)

    t.end()
  })

  modelTest.afterEach((t) => {
    sandbox.restore()
    t.end()
  })

  modelTest.test('getSettleableTransfers should', getSettleableTransfersTest => {
    getSettleableTransfersTest.test('return settleable transfers', test => {
      let settleableTransfers = [{ transferId: 1, creditAccountName: 'dfsp1', debitAccountName: 'dfsp2', creditAmount: 1.00, debitAmount: 1.00 }]

      let joinTransfersStub = sandbox.stub()
      let joinCreditStub = sandbox.stub()
      let joinDebitStub = sandbox.stub()
      let whereNullStub = sandbox.stub()
      let distinctStub = sandbox.stub()

      executedTransfersStubs.leftJoin.returns({
        innerJoin: joinTransfersStub.returns({
          innerJoin: joinCreditStub.returns({
            innerJoin: joinDebitStub.returns({
              whereNull: whereNullStub.returns({
                distinct: distinctStub.returns(P.resolve(settleableTransfers))
              })
            })
          })
        })
      })

      Model.getSettleableTransfers()
        .then(found => {
          test.ok(executedTransfersStubs.leftJoin.withArgs('settledTransfers AS st', 'executedTransfers.transferId', 'st.transferId').calledOnce)
          test.ok(joinTransfersStub.withArgs('transfers AS t', 'executedTransfers.transferId', 't.transferUuid').calledOnce)
          test.ok(joinCreditStub.withArgs('accounts AS ca', 't.creditAccountId', 'ca.accountId').calledOnce)
          test.ok(joinDebitStub.withArgs('accounts AS da', 't.debitAccountId', 'da.accountId').calledOnce)
          test.ok(whereNullStub.withArgs('st.transferId').calledOnce)
          test.ok(distinctStub.withArgs('executedTransfers.transferId AS transferId', 'ca.name AS creditAccountName', 'da.name AS debitAccountName', 't.creditAmount AS creditAmount', 't.debitAmount AS debitAmount').calledOnce)
          test.equal(found, settleableTransfers)
          test.end()
        })
    })

    getSettleableTransfersTest.end()
  })

  modelTest.test('getSettleableTransfersByAccount should', getSettleableTransfersByAccountTest => {
    getSettleableTransfersByAccountTest.test('return settleable transfers by account', test => {
      let accountId = 1
      let settleableTransfers = [{ transferId: 1, creditAccountName: 'dfsp1', debitAccountName: 'dfsp2', creditAmount: 1.00, debitAmount: 1.00 }]

      let joinTransfersStub = sandbox.stub()
      let joinCreditStub = sandbox.stub()
      let joinDebitStub = sandbox.stub()
      let whereNullStub = sandbox.stub()
      let distinctStub = sandbox.stub()
      let andWhereStub = sandbox.stub()

      let groupStub = sandbox.stub()
      let groupWhereStub = sandbox.stub()
      let groupOrWhereStub = sandbox.stub()

      groupStub.where = groupWhereStub.returns({ orWhere: groupOrWhereStub })
      andWhereStub.callsArgWith(0, groupStub)

      executedTransfersStubs.leftJoin.returns({
        innerJoin: joinTransfersStub.returns({
          innerJoin: joinCreditStub.returns({
            innerJoin: joinDebitStub.returns({
              whereNull: whereNullStub.returns({
                distinct: distinctStub.returns({
                  andWhere: andWhereStub.returns(P.resolve(settleableTransfers))
                })
              })
            })
          })
        })
      })

      Model.getSettleableTransfersByAccount(accountId)
        .then(found => {
          test.ok(executedTransfersStubs.leftJoin.withArgs('settledTransfers AS st', 'executedTransfers.transferId', 'st.transferId').calledOnce)
          test.ok(joinTransfersStub.withArgs('transfers AS t', 'executedTransfers.transferId', 't.transferUuid').calledOnce)
          test.ok(joinCreditStub.withArgs('accounts AS ca', 't.creditAccountId', 'ca.accountId').calledOnce)
          test.ok(joinDebitStub.withArgs('accounts AS da', 't.debitAccountId', 'da.accountId').calledOnce)
          test.ok(whereNullStub.withArgs('st.transferId').calledOnce)
          test.ok(distinctStub.withArgs('executedTransfers.transferId AS transferId', 'ca.name AS creditAccountName', 'da.name AS debitAccountName', 't.creditAmount AS creditAmount', 't.debitAmount AS debitAmount').calledOnce)
          test.ok(groupWhereStub.withArgs('t.creditAccountId', accountId).calledOnce)
          test.ok(groupOrWhereStub.withArgs('t.debitAccountId', accountId).calledOnce)
          test.equal(found, settleableTransfers)
          test.end()
        })
    })

    getSettleableTransfersByAccountTest.end()
  })

  modelTest.end()
})
