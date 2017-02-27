'use strict'

const Test = require('tape')
const Model = require('../../../../src/domain/fee/model')

function createFeePayload (chargeId) {
  return {
    transferId: '9f4f2a70-e0d6-42dc-9efb-6d23060ccf8d',
    amount: '1.00',
    payerAccountId: 1,
    payeeAccountId: 2,
    chargeId: chargeId
  }
}

Test('fees model', modelTest => {
  modelTest.test('create should', createTest => {
    createTest.test('create a new fee', test => {
      const payload = createFeePayload(1)

      Model.create(payload)
        .then((fee) => {
          test.equal(fee.transferId, payload.transferId)
          test.equal(fee.amount, payload.amount)
          test.equal(fee.payerAccountId, payload.payerAccountId)
          test.equal(fee.payeeAccountId, payload.payeeAccountId)
          test.equal(fee.chargeId, payload.chargeId)
          test.ok(fee.createdDate)
          test.ok(fee.feeId)
          test.end()
        })
    })

    createTest.end()
  })

  modelTest.test('getAllForTransfer should', getAllForTransferTest => {
    getAllForTransferTest.test('return all fees for a transfer', test => {
      const feePayload1 = createFeePayload(1)
      const feePayload2 = createFeePayload(2)
      const transfer = {
        transferUuid: '9f4f2a70-e0d6-42dc-9efb-6d23060ccf8d'
      }

      Model.create(feePayload1)
        .then(() => Model.create(feePayload2))
        .then(() => Model.getAllForTransfer(transfer))
        .then((fees) => {
          test.ok(fees.length >= 2)
          test.ok(fees.find(a => a.chargeId === feePayload1.chargeId))
          test.ok(fees.find(a => a.chargeId === feePayload2.chargeId))
          test.end()
        })
    })

    getAllForTransferTest.end()
  })

  modelTest.test('doesExist should', doesExistTest => {
    doesExistTest.test('return fee for a transfer and charge', test => {
      const feePayload1 = createFeePayload(1)
      const feePayload2 = createFeePayload(2)
      const charge = { chargeId: feePayload2.chargeId }

      const transfer = {
        transferUuid: '9f4f2a70-e0d6-42dc-9efb-6d23060ccf8d'
      }

      Model.create(feePayload1)
        .then(() => Model.create(feePayload2))
        .then(() => Model.doesExist(charge, transfer))
        .then(fee => {
          test.ok(fee)
          test.equal(fee.chargeId, charge.chargeId)
          test.equal(fee.transferId, transfer.transferUuid)
          test.end()
        })
    })

    doesExistTest.test('return null if fee doesn\'t exist', test => {
      const feePayload = createFeePayload(1)
      const charge = { chargeId: 3 }

      const transfer = {
        transferUuid: '9f4f2a70-e0d6-42dc-9efb-6d23060ccf8d'
      }

      Model.create(feePayload)
        .then(() => Model.doesExist(charge, transfer))
        .then(fee => {
          test.notOk(fee)
          test.end()
        })
    })

    doesExistTest.end()
  })

  modelTest.end()
})
