'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Model = require('../../../../src/domain/fee/model')
const FeeService = require('../../../../src/domain/fee')
const Charges = require('../../../../src/domain/charge')
const TransferQueries = require('../../../../src/domain/transfer/queries')
const Util = require('../../../../src/lib/util')

const createFee = (transfer, charge) => {
  return {
    transferId: transfer.transferUuid,
    amount: Util.formatAmount(charge.rate * transfer.creditAmount),
    payerAccountId: transfer.debitAccountId,
    payeeAccountId: transfer.creditAccountId,
    chargeId: charge.chargeId
  }
}

Test('Fee service', serviceTest => {
  let sandbox

  serviceTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Model, 'create')
    sandbox.stub(Model, 'doesExist')
    sandbox.stub(Model, 'getAllForTransfer')
    sandbox.stub(Charges, 'getAllForTransfer')
    sandbox.stub(TransferQueries, 'getById')
    test.end()
  })

  serviceTest.afterEach(test => {
    sandbox.restore()
    test.end()
  })

  serviceTest.test('generateFeesForTransfer should', generateTest => {
    generateTest.test('add fee in model', test => {
      const charge = {
        name: 'charge',
        chargeId: '1',
        chargeType: 'fee',
        rateType: 'flat',
        rate: '1.00',
        payer: 'sender',
        payee: 'receiver'
      }
      const charge2 = {
        name: 'charge2',
        chargeId: '2',
        chargeType: 'fee',
        rateType: 'percent',
        rate: '0.50',
        payer: 'sender',
        payee: 'receiver'
      }
      const transfer = {
        transferUuid: '012',
        debitAccountId: '1',
        creditAccountId: '2',
        creditAmount: '1.00',
        debitAmount: '1.00'
      }
      const fee = createFee(transfer, charge)
      const fee2 = createFee(transfer, charge2)
      const event = {
        aggregate: {
          id: '012'
        }
      }

      Charges.getAllForTransfer.returns(P.resolve([charge, charge2]))
      TransferQueries.getById.returns(P.resolve(transfer))
      Model.create.returns(P.resolve({}))
      Model.doesExist.returns(P.resolve(null))
      FeeService.generateFeesForTransfer(event)
      .then(() => {
        const firstCallArgs = Model.create.firstCall.args
        test.deepEqual(firstCallArgs[0], fee)
        const secondCallArgs = Model.create.secondCall.args
        test.deepEqual(secondCallArgs[0], fee2)
        test.end()
      })
    })

    generateTest.test('not add fee in model if it already exists', test => {
      const charge = {
        name: 'charge',
        chargeId: '1',
        chargeType: 'fee',
        rateType: 'flat',
        rate: '1.00',
        payer: 'sender',
        payee: 'receiver'
      }
      const transfer = {
        transferUuid: '012',
        debitAccountId: '1',
        creditAccountId: '2',
        creditAmount: '1.00',
        debitAmount: '1.00'
      }
      const fee = createFee(transfer, charge)
      const event = {
        aggregate: {
          id: '012'
        }
      }

      Charges.getAllForTransfer.returns(P.resolve([charge]))
      TransferQueries.getById.returns(P.resolve(transfer))
      Model.create.returns(P.resolve({}))
      Model.doesExist.returns(P.resolve(fee))
      FeeService.generateFeesForTransfer(event)
      .then(() => {
        test.ok(Model.create.notCalled)
        test.end()
      })
    })

    generateTest.end()
  })

  serviceTest.test('getAllForTransfer should', getAllForTransferTest => {
    getAllForTransferTest.test('return fees from Model', test => {
      const charge = {
        name: 'charge',
        chargeId: '1',
        chargeType: 'fee',
        rateType: 'flat',
        rate: '1.00',
        payer: 'sender',
        payee: 'receiver'
      }
      const charge2 = {
        name: 'charge2',
        chargeId: '2',
        chargeType: 'fee',
        rateType: 'percent',
        rate: '.50',
        payer: 'sender',
        payee: 'receiver'
      }
      const transfer = {
        transferUuid: '012',
        debitAccountId: '1',
        creditAccountId: '2',
        creditAmount: '1.00',
        debitAmount: '1.00'
      }
      const fee1 = createFee(transfer, charge)
      fee1.feeId = 0
      const fee2 = createFee(transfer, charge2)
      fee2.feeId = 1
      const fees = [fee1, fee2]

      Model.getAllForTransfer.returns(P.resolve(fees))
      FeeService.getAllForTransfer(transfer)
      .then(result => {
        test.equal(result.length, 2)
        test.equal(result[0].feeId, fee1.feeId)
        test.equal(result[0].transferId, fee1.transferId)
        test.equal(result[0].amount, fee1.amount)
        test.equal(result[0].payerAccountId, fee1.payerAccountId)
        test.equal(result[0].payeeAccountId, fee1.payeeAccountId)
        test.equal(result[0].chargeId, fee1.chargeId)
        test.equal(result[1].feeId, fee2.feeId)
        test.equal(result[1].transferId, fee2.transferId)
        test.equal(result[1].amount, fee2.amount)
        test.equal(result[1].payerAccountId, fee2.payerAccountId)
        test.equal(result[1].payeeAccountId, fee2.payeeAccountId)
        test.equal(result[1].chargeId, fee2.chargeId)
        test.end()
      })
    })

    getAllForTransferTest.end()
  })

  serviceTest.end()
})
