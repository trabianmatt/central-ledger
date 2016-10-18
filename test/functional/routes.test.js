'use strict'

let host = process.env.HOST_IP || 'localhost'
const Request = require('supertest')('http://' + host + ':3000')
const Test = require('tape')
const Uuid = require('uuid4')

let accountCounter = 0
let hostname = 'central-ledger'

function generateTransferId () {
  return Uuid()
}

function generateAccountName () {
  return `dfsp${++accountCounter}`
}

function createAccount (accountName) {
  return Request.post('/accounts').send({ name: accountName })
}

function buildDebitOrCredit (accountName, amount, memo, invoice) {
  return {
    account: `http://${hostname}/accounts/${accountName}`,
    amount: amount,
    memo: memo,
    invoice: invoice,
    authorized: true,
    rejected: false
  }
}

function buildTransfer (transferId, debit, credit) {
  return {
    id: `http://${hostname}/transfers/${transferId}`,
    ledger: `http://${hostname}`,
    debits: [debit],
    credits: [credit],
    execution_condition: 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2',
    expires_at: '2015-06-16T00:00:01.000Z'
  }
}

function prepareTransfer (transferId, transfer) {
  return Request.put('/transfers/' + transferId).send(transfer)
}

function fulfillTransfer (transferId, fulfillment) {
  return Request.put('/transfers/' + transferId + '/fulfillment').set('Content-Type', 'text/plain').send(fulfillment)
}

function findAccountPositions (positions, accountName) {
  return positions.find(function (p) {
    return p.account === buildAccountUrl(accountName)
  })
}

function buildAccountUrl (accountName) {
  return `http://${hostname}/accounts/${accountName}`
}

function buildAccountPosition (accountName, payments, receipts) {
  return {
    account: buildAccountUrl(accountName),
    net: (receipts - payments).toString(),
    payments: payments.toString(),
    receipts: receipts.toString()
  }
}

Test('return metadata', function (assert) {
  Request.get('/')
    .expect(200, function (err, res) {
      if (err) return assert.end(err)
      assert.equal(res.body.currency_code, null)
      assert.equal(res.body.currency_symbol, null)
      assert.equal(res.body.precision, 10)
      assert.equal(res.body.scale, 2)
      assert.equal(Object.keys(res.body.urls).length, 8)
      assert.equal(res.body.urls.health, `http://${hostname}/health`)
      assert.equal(res.body.urls.account, `http://${hostname}/accounts/:name`)
      assert.equal(res.body.urls.accounts, `http://${hostname}/accounts`)
      assert.equal(res.body.urls.transfer, `http://${hostname}/transfers/:id`)
      assert.equal(res.body.urls.transfer_fulfillment, `http://${hostname}/transfers/:id/fulfillment`)
      assert.equal(res.body.urls.transfer_rejection, `http://${hostname}/transfers/:id/rejection`)
      assert.equal(res.body.urls.account_transfers, `ws://${hostname}/accounts/:name/transfers`)
      assert.equal(res.body.urls.positions, `http://${hostname}/positions`)
      assert.end()
    })
    .expect('Content-Type', /json/)
})

Test('return api documentation', function (assert) {
  Request.get('/documentation')
    .expect(200, function (err, res) {
      if (err) return assert.end(err)
      assert.end()
    })
    .expect('Content-Type', /html/)
})

Test('return health', function (assert) {
  Request.get('/health')
    .expect(200, function (err, res) {
      if (err) return assert.end(err)
      assert.equal(res.body.status, 'OK')
      assert.end()
    })
    .expect('Content-Type', /json/)
})

Test('post and get an account', function (assert) {
  let accountName = generateAccountName()

  createAccount(accountName)
    .expect(201, (err, res) => {
      if (err) return assert.end(err)
      let expectedCreated = res.body.created
      assert.notEqual(expectedCreated, undefined)
      assert.equal(res.body.name, accountName)
      Request.get('/accounts/' + accountName)
        .expect(200, (err, getRes) => {
          if (err) return assert.end(err)
          assert.equal(accountName, getRes.body.name)
          assert.equal(expectedCreated, getRes.body.created)
          assert.equal(1000000.00, getRes.body.balance)
          assert.equal(false, getRes.body.is_disabled)
          assert.equal('http://central-ledger', getRes.body.ledger)
          assert.end()
        })
        .expect('Content-Type', /json/)
    })
    .expect('Content-Type', /json/)
})

Test('ensure an account name can only be registered once', function (assert) {
  let accountName = generateAccountName()

  createAccount(accountName)
    .expect(201, function (err, res) {
      if (err) return assert.end(err)
      createAccount(accountName)
        .expect(422, function (err, res) {
          if (err) return assert.end(err)
          assert.equal(res.body.id, 'UnprocessableEntityError')
          assert.equal(res.body.message, 'The account has already been registered')
          assert.end()
        })
        .expect('Content-Type', /json/)
    })
    .expect('Content-Type', /json/)
})

Test('prepare a transfer', function (assert) {
  let account1Name = generateAccountName()
  let account2Name = generateAccountName()

  createAccount(account1Name).then(() => {
    createAccount(account2Name).then(() => {
      let transferId = generateTransferId()
      let transfer = buildTransfer(transferId, buildDebitOrCredit(account1Name, '50', { interledger: 'blah', path: 'blah' }), buildDebitOrCredit(account2Name, '50', { interledger: 'blah', path: 'blah' }))
      prepareTransfer(transferId, transfer)
        .expect(201, function (err, res) {
          if (err) return assert.end(err)
          assert.equal(res.body.id, transfer.id)
          assert.equal(res.body.ledger, transfer.ledger)
          assert.equal(res.body.debits[0].account, transfer.debits[0].account)
          assert.equal(res.body.debits[0].amount, parseInt(transfer.debits[0].amount))
          assert.equal(res.body.credits[0].account, transfer.credits[0].account)
          assert.equal(res.body.credits[0].amount, parseInt(transfer.credits[0].amount))
          assert.equal(res.body.execution_condition, transfer.execution_condition)
          assert.equal(res.body.expires_at, transfer.expires_at)
          assert.equal(res.body.state, 'prepared')
          assert.end()
        })
        .expect('Content-Type', /json/)
    })
  })
})

Test('return transfer details when preparing existing transfer', function (assert) {
  let account1Name = generateAccountName()
  let account2Name = generateAccountName()
  let transferId = generateTransferId()
  let transfer = buildTransfer(transferId, buildDebitOrCredit(account1Name, '50'), buildDebitOrCredit(account2Name, '50'))

  createAccount(account1Name)
  .then(() => createAccount(account2Name))
  .then(() => prepareTransfer(transferId, transfer))
  .then(() => {
    prepareTransfer(transferId, transfer)
    .expect(200, function (err, res) {
      if (err) return assert.end(err)
      assert.equal(res.body.id, transfer.id)
      assert.equal(res.body.ledger, transfer.ledger)
      assert.equal(res.body.debits[0].account, transfer.debits[0].account)
      assert.equal(res.body.debits[0].amount, parseInt(transfer.debits[0].amount))
      assert.equal(res.body.credits[0].account, transfer.credits[0].account)
      assert.equal(res.body.credits[0].amount, parseInt(transfer.credits[0].amount))
      assert.equal(res.body.execution_condition, transfer.execution_condition)
      assert.equal(res.body.expires_at, transfer.expires_at)
      assert.equal(res.body.state, 'prepared')
      assert.end()
    })
    .expect('Content-Type', /json/)
  })
})

Test('return error when preparing existing transfer with changed properties', t => {
  let account1Name = generateAccountName()
  let account2Name = generateAccountName()
  let transferId = generateTransferId()
  let transfer = buildTransfer(transferId, buildDebitOrCredit(account1Name, '50'), buildDebitOrCredit(account2Name, '50'))

  createAccount(account1Name)
  .then(() => createAccount(account2Name))
  .then(() => prepareTransfer(transferId, transfer))
  .then(() => {
    transfer.credits.push(buildDebitOrCredit(account1Name, '50'))
    prepareTransfer(transferId, transfer)
    .expect(422, (err, res) => {
      if (err) return t.end(err)
      t.equal(res.body.id, 'UnprocessableEntityError')
      t.equal(res.body.message, 'The specified entity already exists and may not be modified.')
      t.end()
    })
    .expect('Content-Type', /json/)
  })
})

Test('return error when preparing fulfilled transfer', t => {
  let account1Name = generateAccountName()
  let account2Name = generateAccountName()
  let transferId = generateTransferId()
  let transfer = buildTransfer(transferId, buildDebitOrCredit(account1Name, '50'), buildDebitOrCredit(account2Name, '50'))

  createAccount(account1Name)
  .then(() => createAccount(account2Name))
  .then(() => prepareTransfer(transferId, transfer))
  .then(() => fulfillTransfer(transferId, 'cf:0:_v8'))
  .then(() => {
    prepareTransfer(transferId, transfer)
    .expect(422, (err, res) => {
      if (err) return t.end(err)
      t.equal(res.body.id, 'UnprocessableEntityError')
      t.equal(res.body.message, 'The specified entity already exists and may not be modified.')
      t.end()
    })
    .expect('Content-Type', /json/)
  })
})

Test('return transfer details', function (assert) {
  let account1Name = generateAccountName()
  let account2Name = generateAccountName()

  createAccount(account1Name).then(() => {
    createAccount(account2Name).then(() => {
      let transferId = generateTransferId()
      let transfer = buildTransfer(transferId, buildDebitOrCredit(account1Name, '50'), buildDebitOrCredit(account2Name, '50'))
      prepareTransfer(transferId, transfer).then(() => {
        Request.get('/transfers/' + transferId)
          .expect(200, function (err, res) {
            if (err) return assert.end(err)
            assert.equal(res.body.id, transfer.id)
            assert.equal(res.body.ledger, transfer.ledger)
            assert.equal(res.body.debits[0].account, transfer.debits[0].account)
            assert.equal(res.body.debits[0].amount, parseInt(transfer.debits[0].amount).toFixed(2).toString())
            assert.equal(res.body.credits[0].account, transfer.credits[0].account)
            assert.equal(res.body.credits[0].amount, parseInt(transfer.credits[0].amount).toFixed(2).toString())
            assert.equal(res.body.execution_condition, transfer.execution_condition)
            assert.equal(res.body.expires_at, transfer.expires_at)
            assert.equal(res.body.state, 'prepared')
            assert.ok(res.body.timeline.prepared_at)
            assert.notOk(res.body.timeline.executed_at)
            assert.end()
          })
          .expect('Content-Type', /json/)
      })
    })
  })
})

Test('fulfill a transfer', function (assert) {
  let fulfillment = 'cf:0:_v8'
  let account1Name = generateAccountName()
  let account2Name = generateAccountName()
  let transferId = generateTransferId()

  createAccount(account1Name)
  .then(() => createAccount(account2Name))
  .then(() => prepareTransfer(transferId, buildTransfer(transferId, buildDebitOrCredit(account1Name, '25'), buildDebitOrCredit(account2Name, '25'))))
  .then(() => {
    fulfillTransfer(transferId, fulfillment)
      .expect(200, function (err, res) {
        if (err) return assert.end(err)
        assert.equal(res.text, fulfillment)
        assert.end()
      })
      .expect('Content-Type', 'text/plain; charset=utf-8')
  })
})

Test('get fulfillment for transfer', function (assert) {
  let fulfillment = 'cf:0:_v8'
  let account1Name = generateAccountName()
  let account2Name = generateAccountName()
  let transferId = generateTransferId()

  createAccount(account1Name)
  .then(account1 => createAccount(account2Name))
  .then(account2 => prepareTransfer(transferId, buildTransfer(transferId, buildDebitOrCredit(account1Name, '25'), buildDebitOrCredit(account2Name, '25'))))
  .then(prepared => fulfillTransfer(transferId, fulfillment))
  .then(fulfilled => {
    Request.get('/transfers/' + transferId + '/fulfillment')
      .expect(200, function (err, res) {
        if (err) return assert.end(err)
        assert.equal(res.text, fulfillment)
        assert.end()
      })
      .expect('Content-Type', 'text/plain; charset=utf-8')
  })
})

Test('return error when retrieving fulfillment if transfer not executed', function (assert) {
  let account1Name = generateAccountName()
  let account2Name = generateAccountName()

  createAccount(account1Name).then(() => {
    createAccount(account2Name).then(() => {
      let transferId = generateTransferId()
      prepareTransfer(transferId, buildTransfer(transferId, buildDebitOrCredit(account1Name, '50'), buildDebitOrCredit(account2Name, '50'))).then(() => {
        Request.get('/transfers/' + transferId + '/fulfillment')
          .expect(404, function (err, res) {
            if (err) return assert.end(err)
            assert.equal(res.body.id, 'NotFoundError')
            assert.equal(res.body.message, 'The requested resource could not be found.')
            assert.pass()
            assert.end()
          })
      })
    })
  })
})

Test('return error when fulfilling non-existing transfer', function (assert) {
  let fulfillment = 'cf:0:_v8'

  Request.put('/transfers/' + generateTransferId() + '/fulfillment')
    .set('Content-Type', 'text/plain')
    .send(fulfillment)
    .expect(404, function (err, res) {
      if (err) return assert.end(err)
      assert.equal(res.body.id, 'NotFoundError')
      assert.equal(res.body.message, 'The requested resource could not be found.')
      assert.pass()
      assert.end()
    })
})

Test('return fulfillment when fulfilling already fulfilled transfer', function (assert) {
  let fulfillment = 'cf:0:_v8'
  let account1Name = generateAccountName()
  let account2Name = generateAccountName()

  createAccount(account1Name).then(() => {
    createAccount(account2Name).then(() => {
      let transferId = generateTransferId()
      prepareTransfer(transferId, buildTransfer(transferId, buildDebitOrCredit(account1Name, '25'), buildDebitOrCredit(account2Name, '25'))).then(() => {
        fulfillTransfer(transferId, fulfillment).then(() => {
          fulfillTransfer(transferId, fulfillment)
            .expect(200, function (err, res) {
              if (err) return assert.end(err)
              assert.equal(res.text, fulfillment)
              assert.end()
            })
            .expect('Content-Type', 'text/plain; charset=utf-8')
        })
      })
    })
  })
})

Test('reject a transfer', function (assert) {
  let reason = 'rejection reason'

  Request.put('/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204/rejection')
    .set('Content-Type', 'text/plain')
    .send(reason)
    .expect(200, function (err, res) {
      if (err) assert.end(err)
      assert.equal(res.text, reason)
      assert.end()
    })
    .expect('Content-Type', 'text/plain; charset=utf-8')
})

Test('return net positions', function (assert) {
  let fulfillment = 'cf:0:_v8'
  let account1Name = generateAccountName()
  let account2Name = generateAccountName()
  let account3Name = generateAccountName()

  createAccount(account1Name).then(() => {
    createAccount(account2Name).then(() => {
      createAccount(account3Name).then(() => {
        let transfer1Id = generateTransferId()
        let transfer2Id = generateTransferId()
        let transfer3Id = generateTransferId()

        prepareTransfer(transfer1Id, buildTransfer(transfer1Id, buildDebitOrCredit(account1Name, '25'), buildDebitOrCredit(account2Name, '25'))).then(() => {
          prepareTransfer(transfer2Id, buildTransfer(transfer2Id, buildDebitOrCredit(account1Name, '10'), buildDebitOrCredit(account3Name, '10'))).then(() => {
            prepareTransfer(transfer3Id, buildTransfer(transfer3Id, buildDebitOrCredit(account3Name, '15'), buildDebitOrCredit(account2Name, '15'))).then(() => {
              fulfillTransfer(transfer1Id, fulfillment).then(() => {
                fulfillTransfer(transfer2Id, fulfillment).then(() => {
                  fulfillTransfer(transfer3Id, fulfillment).then(() => {
                    Request.get('/positions')
                      .expect(200, function (err, res) {
                        if (err) assert.end(err)
                        assert.deepEqual(findAccountPositions(res.body.positions, account1Name), buildAccountPosition(account1Name, 35, 0))
                        assert.deepEqual(findAccountPositions(res.body.positions, account2Name), buildAccountPosition(account2Name, 0, 40))
                        assert.deepEqual(findAccountPositions(res.body.positions, account3Name), buildAccountPosition(account3Name, 15, 10))
                        assert.end()
                      })
                      .expect('Content-Type', /json/)
                  })
                })
              })
            })
          })
        })
      })
    })
  })
})
