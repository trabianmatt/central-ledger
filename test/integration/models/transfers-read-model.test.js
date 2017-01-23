'use strict'

const src = '../../../src'
const _ = require('lodash')
const P = require('bluebird')
const Test = require('tape')
const Moment = require('moment')
const Db = require(`${src}/db`)
const Account = require(`${src}/domain/account`)
const ReadModel = require(`${src}/models/transfers-read-model`)
const Fixtures = require('../../fixtures')
const TransferState = require('../../../src/domain/transfer/state')

let pastDate = () => {
  let d = new Date()
  d.setDate(d.getDate() - 5)
  return d
}

function createAccounts (accountNames) {
  return P.all(accountNames.map(name => Account.create({ name: name }))).then(accounts => _.reduce(accounts, (m, acct) => _.set(m, acct.name, acct.accountId), {}))
}

function buildReadModelDebitOrCredit (accountName, amount, accountMap) {
  let record = Fixtures.buildDebitOrCredit(accountName, amount)
  record.accountId = accountMap[accountName]
  return record
}

Test('transfers read model', function (modelTest) {
  modelTest.test('saveTransfer should', function (saveTransferTest) {
    saveTransferTest.test('save a transfer to the read model', function (assert) {
      let debitAccountName = Fixtures.generateAccountName()
      let creditAccountName = Fixtures.generateAccountName()

      createAccounts([debitAccountName, creditAccountName])
        .then(accountMap => {
          let transfer = Fixtures.buildReadModelTransfer(Fixtures.generateTransferId(), buildReadModelDebitOrCredit(debitAccountName, '50', accountMap), buildReadModelDebitOrCredit(creditAccountName, '50', accountMap), TransferState.PREPARED)
          ReadModel.saveTransfer(transfer)
            .then(savedTransfer => {
              assert.ok(savedTransfer)
              assert.equal(savedTransfer.transferUuid, transfer.transferUuid)
              assert.equal(savedTransfer.state, transfer.state)
              assert.end()
            })
        })
    })

    saveTransferTest.end()
  })

  modelTest.test('updateTransfer should', function (updateTransferTest) {
    updateTransferTest.test('update a transfer in the read model', function (assert) {
      let debitAccountName = Fixtures.generateAccountName()
      let creditAccountName = Fixtures.generateAccountName()

      let transferId = Fixtures.generateTransferId()

      createAccounts([debitAccountName, creditAccountName])
        .then(accountMap => {
          let transfer = Fixtures.buildReadModelTransfer(transferId, buildReadModelDebitOrCredit(debitAccountName, '50', accountMap), buildReadModelDebitOrCredit(creditAccountName, '50', accountMap), TransferState.PREPARED)
          ReadModel.saveTransfer(transfer)
            .then(() => {
              let updatedFields = { state: TransferState.EXECUTED, fulfillment: 'oAKAAA', executedDate: Moment(1474471284081) }
              return ReadModel.updateTransfer(transferId, updatedFields)
                .then(updatedTransfer => {
                  assert.equal(updatedTransfer.transferUuid, transferId)
                  assert.equal(updatedTransfer.state, updatedFields.state)
                  assert.equal(updatedTransfer.fulfillment, updatedFields.fulfillment)
                  assert.deepEqual(updatedTransfer.executedDate, updatedFields.executedDate.toDate())
                  assert.end()
                })
            })
        })
    })

    updateTransferTest.end()
  })

  modelTest.test('truncateTransfers should', function (truncateTest) {
    truncateTest.test('delete all records from transfers table', function (assert) {
      Db.connect().then(db => db.transfers.countAsync())
        .then(count => {
          assert.ok(parseInt(count) > 0)
          ReadModel.truncateTransfers()
            .then(() => {
              Db.connect()
                .then(db => {
                  db.transfers.countAsync()
                    .then(count => {
                      assert.equal(parseInt(count), 0)
                      assert.end()
                    })
                })
            })
        })
    })

    truncateTest.end()
  })

  modelTest.test('getById should', function (getByIdTest) {
    getByIdTest.test('retrieve transfer from read model by id and set account fields', function (assert) {
      let debitAccountName = Fixtures.generateAccountName()
      let creditAccountName = Fixtures.generateAccountName()

      createAccounts([debitAccountName, creditAccountName])
        .then(accountMap => {
          let transfer = Fixtures.buildReadModelTransfer(Fixtures.generateTransferId(), buildReadModelDebitOrCredit(debitAccountName, '50', accountMap), buildReadModelDebitOrCredit(creditAccountName, '50', accountMap), TransferState.PREPARED)
          ReadModel.saveTransfer(transfer)
            .then(saved => {
              ReadModel.getById(saved.transferUuid)
                .then(found => {
                  assert.notEqual(found, saved)
                  assert.notOk(saved.creditAccountName)
                  assert.notOk(saved.debitAccountName)
                  assert.equal(found.transferUuid, saved.transferUuid)
                  assert.equal(found.creditAccountId, accountMap[creditAccountName])
                  assert.equal(found.creditAccountName, creditAccountName)
                  assert.equal(found.debitAccountId, accountMap[debitAccountName])
                  assert.equal(found.debitAccountName, debitAccountName)
                  assert.end()
                })
            })
        })
    })

    getByIdTest.end()
  })

  modelTest.test('getTransfersByState should', function (getByStateTest) {
    getByStateTest.test('retrieve executed transfers with set account fields', function (assert) {
      ReadModel.truncateTransfers()
        .then(() => {
          let debitAccountName = Fixtures.generateAccountName()
          let creditAccountName = Fixtures.generateAccountName()

          createAccounts([debitAccountName, creditAccountName])
            .then(accountMap => {
              let transfer = Fixtures.buildReadModelTransfer(Fixtures.generateTransferId(), buildReadModelDebitOrCredit(debitAccountName, '50', accountMap), buildReadModelDebitOrCredit(creditAccountName, '50', accountMap), TransferState.EXECUTED)
              let otherTransfer = Fixtures.buildReadModelTransfer(Fixtures.generateTransferId(), buildReadModelDebitOrCredit(debitAccountName, '20', accountMap), buildReadModelDebitOrCredit(creditAccountName, '20', accountMap), TransferState.PREPARED)
              ReadModel.saveTransfer(transfer)
                .then(() => {
                  ReadModel.saveTransfer(otherTransfer)
                    .then(() => {
                      ReadModel.getTransfersByState(TransferState.EXECUTED)
                        .then(found => {
                          assert.equal(found.length, 1)
                          assert.equal(found[0].transferUuid, transfer.transferUuid)
                          assert.equal(found[0].creditAccountId, accountMap[creditAccountName])
                          assert.equal(found[0].creditAccountName, creditAccountName)
                          assert.equal(found[0].debitAccountId, accountMap[debitAccountName])
                          assert.equal(found[0].debitAccountName, debitAccountName)
                          assert.end()
                        })
                    })
                })
            })
        })
    })

    getByStateTest.end()
  })

  modelTest.test('findExpired should', expiredTest => {
    expiredTest.test('retrieve prepared transfers with past expires at', t => {
      let debitAccountName = Fixtures.generateAccountName()
      let creditAccountName = Fixtures.generateAccountName()

      let transferId = Fixtures.generateTransferId()
      let futureTransferId = Fixtures.generateTransferId()

      createAccounts([debitAccountName, creditAccountName])
        .then(accountMap => {
          let transfer = Fixtures.buildReadModelTransfer(transferId, buildReadModelDebitOrCredit(debitAccountName, '50', accountMap), buildReadModelDebitOrCredit(creditAccountName, '50', accountMap), TransferState.PREPARED, pastDate())
          let futureTransfer = Fixtures.buildReadModelTransfer(futureTransferId, buildReadModelDebitOrCredit(debitAccountName, '50', accountMap), buildReadModelDebitOrCredit(creditAccountName, '50', accountMap), TransferState.PREPARED)
          ReadModel.saveTransfer(transfer)
            .then(() => ReadModel.saveTransfer(futureTransfer))
            .then(() => {
              ReadModel.findExpired()
                .then(found => {
                  t.equal(found.length, 1)
                  t.equal(found[0].transferUuid, transferId)
                  t.notOk(found[0].debitAccountName)
                  t.notOk(found[0].creditAccountName)
                  t.end()
                })
            })
        })
    })

    expiredTest.end()
  })

  modelTest.end()
})
