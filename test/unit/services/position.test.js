'use strict'

const src = '../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Config = require(`${src}/lib/config`)
const Service = require(`${src}/services/position`)
const AccountsModel = require(`${src}/models/accounts`)
const SettleableTransfersReadModel = require(`${src}/models/settleable-transfers-read-model`)

Test('Position Service tests', (serviceTest) => {
  let sandbox
  let originalHostName
  let hostname = 'http://some-host'
  let accounts = [{ accountId: 1, name: 'dfsp1' }, { accountId: 2, name: 'dfsp2' }, { accountId: 3, name: 'dfsp3' }, { accountId: 4, name: 'dfsp4' }]

  serviceTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    originalHostName = Config.HOSTNAME
    Config.HOSTNAME = hostname
    sandbox.stub(AccountsModel, 'getAll')
    sandbox.stub(AccountsModel, 'getById')
    sandbox.stub(SettleableTransfersReadModel, 'getSettleableTransfers')
    sandbox.stub(SettleableTransfersReadModel, 'getSettleableTransfersByAccount')
    AccountsModel.getAll.returns(P.resolve(accounts))
    t.end()
  })

  serviceTest.afterEach(t => {
    Config.HOSTNAME = originalHostName
    sandbox.restore()
    t.end()
  })

  function buildEmptyPosition (accountName) {
    return buildPosition(accountName, '0', '0', '0')
  }

  function buildPosition (accountName, payments, receipts, net) {
    return {
      account: `${hostname}/accounts/${accountName}`,
      payments: payments,
      receipts: receipts,
      net: net
    }
  }

  function buildTransfer (debitAccount, debitAmount, creditAccount, creditAmount) {
    return {
      debitAccountName: debitAccount,
      debitAmount: debitAmount,
      creditAccountName: creditAccount,
      creditAmount: creditAmount
    }
  }

  serviceTest.test('calculateForAccount should', (calcForAccountTest) => {
    calcForAccountTest.test('return single position for desired account', (assert) => {
      let account = accounts[0]

      let transfers = [
        buildTransfer(accounts[0].name, 3, accounts[1].name, 3),
        buildTransfer(accounts[0].name, 2, accounts[2].name, 2)
      ]

      SettleableTransfersReadModel.getSettleableTransfersByAccount.withArgs(account.accountId).returns(P.resolve(transfers))

      let expected = buildPosition(accounts[0].name, '5', '0', '-5')
      Service.calculateForAccount(account)
        .then(position => {
          assert.deepEqual(position, expected)
          assert.end()
        })
    })

    calcForAccountTest.end()
  })

  serviceTest.test('calculateForAllAccounts should', (calcAllTest) => {
    calcAllTest.test('return no positions if no accounts retrieved', (assert) => {
      AccountsModel.getAll.returns(P.resolve([]))

      let transfers = [
        buildTransfer(accounts[0].name, 3, accounts[1].name, 3)
      ]

      SettleableTransfersReadModel.getSettleableTransfers.returns(P.resolve(transfers))

      let expected = []
      Service.calculateForAllAccounts()
        .then(positions => {
          assert.ok(AccountsModel.getAll.called)
          assert.notOk(SettleableTransfersReadModel.getSettleableTransfers.called)
          assert.deepEqual(positions, expected)
          assert.end()
        })
    })

    calcAllTest.test('return empty positions for all accounts if no settleable transfers', (assert) => {
      let expected = [
        buildEmptyPosition(accounts[0].name),
        buildEmptyPosition(accounts[1].name),
        buildEmptyPosition(accounts[2].name),
        buildEmptyPosition(accounts[3].name)
      ]

      SettleableTransfersReadModel.getSettleableTransfers.returns(P.resolve([]))

      Service.calculateForAllAccounts()
        .then(positions => {
          assert.ok(AccountsModel.getAll.called)
          assert.ok(SettleableTransfersReadModel.getSettleableTransfers.called)
          assert.equal(positions.length, accounts.length)
          assert.deepEqual(positions, expected)
          assert.end()
        })
    })

    calcAllTest.test('return expected positions if settleable transfers exist', (assert) => {
      let transfers = [
        buildTransfer(accounts[0].name, 3, accounts[1].name, 3),
        buildTransfer(accounts[0].name, 2, accounts[2].name, 2)
      ]

      SettleableTransfersReadModel.getSettleableTransfers.returns(P.resolve(transfers))

      let expected = [
        buildPosition(accounts[0].name, '5', '0', '-5'),
        buildPosition(accounts[1].name, '0', '3', '3'),
        buildPosition(accounts[2].name, '0', '2', '2'),
        buildEmptyPosition(accounts[3].name)
      ]

      Service.calculateForAllAccounts()
        .then(positions => {
          assert.ok(AccountsModel.getAll.called)
          assert.ok(SettleableTransfersReadModel.getSettleableTransfers.calledOnce)
          assert.deepEqual(positions, expected)
          assert.end()
        })
    })

    calcAllTest.end()
  })

  serviceTest.end()
})
