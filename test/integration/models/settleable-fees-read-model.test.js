'use strict'

const src = '../../../src'
const Test = require('tape')
const Uuid = require('uuid4')
const ExecutedTransfersModel = require(`${src}/models/executed-transfers`)
const SettledTransfersModel = require(`${src}/models/settled-transfers`)
const FeesModel = require(`${src}/domain/fee/model`)
const Account = require(`${src}/domain/account`)
const Fixtures = require('../../fixtures')
const P = require('bluebird')

function generateFeePayload (transferId, payerAccountId, payeeAccountId, settlementId) {
  return {
    transferId,
    amount: 10,
    payerAccountId,
    payeeAccountId,
    chargeId: 1,
    settlementId
  }
}

Test('fees model', modelTest => {
  modelTest.test('getSettleableFeesByAccount should', getSettleableFeesByAccountTest => {
    getSettleableFeesByAccountTest.test('retrieve fee ids for a specified account that are attached to transfers that are executed but not settled', test => {
      const account1Name = Fixtures.generateAccountName()
      const account2Name = Fixtures.generateAccountName()
      const account3Name = Fixtures.generateAccountName()

      P.all([Account.create({ name: account1Name, password: '1234' }), Account.create({ name: account2Name, password: '1234' }), Account.create({ name: account3Name, password: '1234' })]).then(([account1, account2, account3]) => {
        const unSettledTransferId = Fixtures.generateTransferId()
        const settledTransferId = Fixtures.generateTransferId()
        const unSettledOtherTransferId = Fixtures.generateTransferId()

        const unsettledFee = generateFeePayload(unSettledTransferId, account1.accountId, account2.accountId)
        const settledFee = generateFeePayload(settledTransferId, account2.accountId, account1.accountId, Uuid())
        const otherUnsettledFee = generateFeePayload(unSettledOtherTransferId, account2.accountId, account3.accountId)

        return ExecutedTransfersModel.create({ id: unSettledTransferId })
          .then(() => ExecutedTransfersModel.create({ id: unSettledOtherTransferId }))
          .then(() => ExecutedTransfersModel.create({ id: settledTransferId }))
          .then(() => SettledTransfersModel.create({ id: settledTransferId, settlementId: Uuid() }))
          .then(() => P.all([FeesModel.create(unsettledFee), FeesModel.create(settledFee), FeesModel.create(otherUnsettledFee)]))
          .then(([fee1, fee2, fee3]) => {
            return FeesModel.getSettleableFeesByAccount(account1).then(result => {
              test.notOk(result.find(x => x.feeId === fee3.feeId))
              test.notOk(result.find(x => x.feeId === fee2.feeId))
              test.ok(result.find(x => x.feeId === fee1.feeId))
              test.end()
            })
          })
      })

      getSettleableFeesByAccountTest.end()
    })

    modelTest.end()
  })
})
