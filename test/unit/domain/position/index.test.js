'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Config = require(`${src}/lib/config`)
const Service = require(`${src}/domain/position`)
const Account = require(`${src}/domain/account`)
const Fee = require(`${src}/domain/fee`)
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
    sandbox.stub(Account, 'getAll')
    sandbox.stub(Account, 'getById')
    sandbox.stub(SettleableTransfersReadModel, 'getSettleableTransfers')
    sandbox.stub(SettleableTransfersReadModel, 'getSettleableTransfersByAccount')
    sandbox.stub(Fee, 'getSettleableFeesByAccount')
    sandbox.stub(Fee, 'getSettleableFees')
    Account.getAll.returns(P.resolve(accounts))
    t.end()
  })

  serviceTest.afterEach(t => {
    Config.HOSTNAME = originalHostName
    sandbox.restore()
    t.end()
  })

  function buildEmptyPosition (accountName) {
    return buildPosition(accountName, '0', '0', '0', '0', '0', '0', '0')
  }

  function buildPosition (accountName, tPayments, tReceipts, tNet, fPayments, fReceipts, fNet, net) {
    return {
      account: `${hostname}/accounts/${accountName}`,
      fees: {
        payments: fPayments,
        receipts: fReceipts,
        net: fNet
      },
      transfers: {
        payments: tPayments,
        receipts: tReceipts,
        net: tNet
      },
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

  function buildFee (payerAccount, payerAmount, payeeAccount, payeeAmount) {
    return {
      payerAccountName: payerAccount,
      payerAmount: payerAmount,
      payeeAccountName: payeeAccount,
      payeeAmount: payeeAmount
    }
  }

  serviceTest.test('calculateForAllAccounts should', (calcAllTest) => {
    calcAllTest.test('return no positions if no accounts retrieved', (test) => {
      Account.getAll.returns(P.resolve([]))

      let transfers = [
        buildTransfer(accounts[0].name, 3, accounts[1].name, 3)
      ]

      SettleableTransfersReadModel.getSettleableTransfers.returns(P.resolve(transfers))
      Fee.getSettleableFees.returns(P.resolve([]))

      let expected = []
      Service.calculateForAllAccounts()
        .then(positions => {
          test.ok(Account.getAll.called)
          test.notOk(SettleableTransfersReadModel.getSettleableTransfers.called)
          test.notOk(Fee.getSettleableFees.called)
          test.deepEqual(positions, expected)
          test.end()
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
      Fee.getSettleableFees.returns(P.resolve([]))

      Service.calculateForAllAccounts()
        .then(positions => {
          assert.ok(Account.getAll.called)
          assert.ok(SettleableTransfersReadModel.getSettleableTransfers.called)
          assert.ok(Fee.getSettleableFees.called)
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
      let fees = [
        buildFee(accounts[0].name, 1, accounts[1].name, 1),
        buildFee(accounts[2].name, 6, accounts[0].name, 6)
      ]

      SettleableTransfersReadModel.getSettleableTransfers.returns(P.resolve(transfers))
      Fee.getSettleableFees.returns(P.resolve(fees))

      let expected = [
        buildPosition(accounts[0].name, '5', '0', '-5', '1', '6', '5', '0'),
        buildPosition(accounts[1].name, '0', '3', '3', '0', '1', '1', '4'),
        buildPosition(accounts[2].name, '0', '2', '2', '6', '0', '-6', '-4'),
        buildEmptyPosition(accounts[3].name)
      ]

      Service.calculateForAllAccounts()
        .then(positions => {
          assert.ok(Account.getAll.called)
          assert.ok(SettleableTransfersReadModel.getSettleableTransfers.calledOnce)
          assert.ok(Fee.getSettleableFees.calledOnce)
          assert.deepEqual(positions, expected)
          assert.end()
        })
    })

    calcAllTest.end()
  })

  serviceTest.test('calculateForAccount should', (calcAccountTest) => {
    calcAccountTest.test('return empty positions for account if no settleable transfers or fees', (test) => {
      const expected = {
        account: `${hostname}/accounts/${accounts[0].name}`,
        fees: {
          payments: '0',
          receipts: '0',
          net: '0'
        },
        transfers: {
          payments: '0',
          receipts: '0',
          net: '0'
        },
        net: '0'
      }
      const account = {
        name: 'dfsp1',
        id: 11
      }
      SettleableTransfersReadModel.getSettleableTransfersByAccount.returns(P.resolve([]))
      Fee.getSettleableFeesByAccount.returns(P.resolve([]))

      Service.calculateForAccount(account)
        .then(positions => {
          test.ok(SettleableTransfersReadModel.getSettleableTransfersByAccount.called)
          test.ok(Fee.getSettleableFeesByAccount.called)
          test.deepEqual(positions, expected)
          test.end()
        })
    })

    calcAccountTest.test('return expected positions if settleable transfers and fees exist', (test) => {
      let transfers = [
        buildTransfer(accounts[0].name, 10, accounts[1].name, 10),
        buildTransfer(accounts[1].name, 5, accounts[0].name, 5)
      ]
      let fees = [
        buildFee(accounts[0].name, 1, accounts[1].name, 1),
        buildFee(accounts[2].name, 6, accounts[0].name, 6)
      ]

      SettleableTransfersReadModel.getSettleableTransfersByAccount.returns(P.resolve(transfers))
      Fee.getSettleableFeesByAccount.returns(P.resolve(fees))

      let expected = {
        account: `${hostname}/accounts/${accounts[0].name}`,
        fees: {
          payments: '1',
          receipts: '6',
          net: '5'
        },
        transfers: {
          payments: '10',
          receipts: '5',
          net: '-5'
        },
        net: '0'
      }
      const account = {
        name: 'dfsp1',
        id: 11
      }
      Service.calculateForAccount(account)
        .then(positions => {
          test.ok(SettleableTransfersReadModel.getSettleableTransfersByAccount.calledOnce)
          test.ok(Fee.getSettleableFeesByAccount.calledOnce)
          test.deepEqual(positions, expected)
          test.end()
        })
    })

    calcAccountTest.end()
  })

  serviceTest.end()
})
