'use strict'

const src = '../../../src'
const Test = require('tape')
const Uuid = require('uuid4')
const ExecutedTransfersModel = require(`${src}/models/executed-transfers`)
const SettledTransfersModel = require(`${src}/models/settled-transfers`)
const AccountsModel = require(`${src}/models/accounts`)
const TransfersReadModel = require(`${src}/models/transfers-read-model`)
const ReadModel = require(`${src}/models/settleable-transfers-read-model`)
const Fixtures = require('../../fixtures')
const TransferState = require(`${src}/domain/transfer/state`)

Test('transfers read model', function (modelTest) {
  modelTest.test('getSettleableTransfers should', function (getSettleableTransfersTest) {
    getSettleableTransfersTest.test('retrieve transfer ids that are executed but not settled', function (assert) {
      let settledTransferId = Fixtures.generateTransferId()
      let settledCreditAccountId
      let settledCreditAccountName = 'dfsp4'
      let settledDebitAccountId
      let settledDebitAccountName = 'dfsp3'
      let settledCreditAmount = '11'
      let settledDebitAmount = '-11'

      let unSettledTransferId = Fixtures.generateTransferId()
      let unSettledCreditAccountId
      let unSettledCreditAccountName = 'dfsp6'
      let unSettledDebitAccountId
      let unSettledDebitAccountName = 'dfsp5'
      let unSettledCreditAmount = '50'
      let unSettledDebitAmount = '-50'

      ExecutedTransfersModel.create({ id: unSettledTransferId })
        .then(() => ExecutedTransfersModel.create({ id: settledTransferId }))
        .then(() => SettledTransfersModel.create({ id: settledTransferId, settlementId: Uuid() }))
        .then(() => AccountsModel.create({ name: unSettledCreditAccountName }).then(account => { unSettledCreditAccountId = account.accountId }))
        .then(() => AccountsModel.create({ name: unSettledDebitAccountName }).then(account => { unSettledDebitAccountId = account.accountId }))
        .then(() => AccountsModel.create({ name: settledCreditAccountName }).then(account => { settledCreditAccountId = account.accountId }))
        .then(() => AccountsModel.create({ name: settledDebitAccountName }).then(account => { settledDebitAccountId = account.accountId }))
        .then(() => {
          let credit = Fixtures.buildDebitOrCredit(unSettledCreditAccountName, unSettledCreditAmount)
          credit.accountId = unSettledCreditAccountId
          let debit = Fixtures.buildDebitOrCredit(unSettledDebitAccountName, unSettledDebitAmount)
          debit.accountId = unSettledDebitAccountId
          return TransfersReadModel.saveTransfer(Fixtures.buildReadModelTransfer(unSettledTransferId, credit, debit, TransferState.EXECUTED)).catch(e => { assert.equals(e, '') })
        })
        .then(() => {
          let credit = Fixtures.buildDebitOrCredit(settledCreditAccountName, settledCreditAmount)
          credit.accountId = settledCreditAccountId
          let debit = Fixtures.buildDebitOrCredit(settledDebitAccountName, settledDebitAmount)
          debit.accountId = settledDebitAccountId
          return TransfersReadModel.saveTransfer(Fixtures.buildReadModelTransfer(settledTransferId, credit, debit, TransferState.EXECUTED))
        })
        .then(() =>
          ReadModel.getSettleableTransfers().then(result => {
            assert.notOk(result.find(x => x.transferId === settledTransferId))
            assert.ok(result.find(x => x.transferId === unSettledTransferId))
            assert.end()
          }))
    })

    getSettleableTransfersTest.end()
  })

  modelTest.end()
})
