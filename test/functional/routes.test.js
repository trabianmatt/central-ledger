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

Test('return metadata', function (assert) {
  Request.get('/')
    .expect(200, function (err, res) {
      if (err) return assert.end(err)
      assert.equal(res.body.currency_code, null)
      assert.equal(res.body.currency_symbol, null)
      assert.equal(res.body.precision, 10)
      assert.equal(res.body.scale, 2)
      assert.equal(Object.keys(res.body.urls).length, 9)
      assert.equal(res.body.urls.health, `http://${hostname}/health`)
      assert.equal(res.body.urls.account, `http://${hostname}/accounts/:name`)
      assert.equal(res.body.urls.subscription, `http://${hostname}/subscriptions/:id`)
      assert.equal(res.body.urls.accounts, `http://${hostname}/accounts`)
      assert.equal(res.body.urls.transfer, `http://${hostname}/transfers/:id`)
      assert.equal(res.body.urls.transfer_fulfillment, `http://${hostname}/transfers/:id/fulfillment`)
      assert.equal(res.body.urls.transfer_rejection, `http://${hostname}/transfers/:id/rejection`)
      assert.equal(res.body.urls.account_transfers, `ws://${hostname}/accounts/:name/transfers`)
      assert.equal(res.body.urls.settlements, `http://${hostname}/settlements`)
      assert.end()
    })
    .expect('Content-Type', /json/)
})

Test('return api documentation', function (assert) {
  Request.get('/documentation')
    .expect('Content-Type', /html/)
    .expect(200, function (err, res) {
      if (err) return assert.end(err)
      assert.end()
    })
})

Test('return health', function (assert) {
  Request.get('/health')
    .expect('Content-Type', /json/)
    .expect(200, function (err, res) {
      if (err) return assert.end(err)
      assert.equal(res.body.status, 'OK')
      assert.end()
    })
})

Test('post and get a subscription', function (assert) {
  let subscription = {
    'url': 'http://localhost/blah',
    'secret': 'secret'
  }

  Request.post('/subscriptions')
    .send(subscription)
    .expect('Content-Type', /json/)
    .expect(201, function (err, res) {
      if (err) return assert.end(err)
      let expectedId = res.body.id
      let expectedUrl = res.body.url
      let expectedCreated = res.body.created
      Request.get('/subscriptions/' + expectedId)
        .expect('Content-Type', /json/)
        .expect(200, function (err, res) {
          if (err) return assert.end(err)
          assert.equal(expectedId, res.body.id)
          assert.equal(expectedUrl, res.body.url)
          assert.equal(expectedCreated, res.body.created)
          assert.end()
        })
    })
})

Test('post and get an account', function (assert) {
  var accountName = generateAccountName()

  createAccount(accountName)
    .expect('Content-Type', /json/)
    .expect(201, (err, res) => {
      if (err) return assert.end(err)
      var expectedCreated = res.body.created
      assert.notEqual(expectedCreated, undefined)
      assert.equal(res.body.name, accountName)
      Request.get('/accounts/' + accountName)
        .expect('Content-Type', /json/)
        .expect(200, (err, getRes) => {
          if (err) return assert.end(err)
          assert.equal(accountName, getRes.body.name)
          assert.equal(expectedCreated, getRes.body.created)
          assert.equal(1000000.00, getRes.body.balance)
          assert.equal(false, getRes.body.is_disabled)
          assert.equal('http://central-ledger', getRes.body.ledger)
          assert.end()
        })
    })
})

Test('ensure an account name can only be registered once', function (assert) {
  var accountName = generateAccountName()

  createAccount(accountName)
    .expect('Content-Type', /json/)
    .expect(201, function (err, res) {
      if (err) return assert.end(err)
      createAccount(accountName)
        .expect('Content-Type', /json/)
        .expect(400, function (err, res) {
          if (err) return assert.end(err)
          assert.equal(res.body.statusCode, 400)
          assert.equal(res.body.error, 'Bad Request')
          assert.equal(res.body.message, 'The account has already been registered')
          assert.end()
        })
    })
})

Test('prepare a transfer', function (assert) {
  let account1Name = generateAccountName()
  let account2Name = generateAccountName()

  createAccount(account1Name).then(() => {
    createAccount(account2Name).then(() => {
      let transferId = generateTransferId()
      let transfer = buildTransfer(transferId, buildDebitOrCredit(account1Name, '50', { interledger: 'blah', path: 'blah' }), buildDebitOrCredit(account2Name, '50', { interledger: 'blah', path: 'blah' }))
      prepareTransfer(transferId, transfer)
        .expect('Content-Type', /json/)
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
    })
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
          .expect('Content-Type', /json/)
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
      })
    })
  })
})

Test('fulfill a transfer', function (assert) {
  let fulfillment = 'cf:0:_v8'
  let account1Name = generateAccountName()
  let account2Name = generateAccountName()

  createAccount(account1Name).then(() => {
    createAccount(account2Name).then(() => {
      let transferId = generateTransferId()
      prepareTransfer(transferId, buildTransfer(transferId, buildDebitOrCredit(account1Name, '25'), buildDebitOrCredit(account2Name, '25'))).then(() => {
        fulfillTransfer(transferId, fulfillment)
          .expect('Content-Type', 'text/plain; charset=utf-8')
          .expect(200, function (err, res) {
            if (err) return assert.end(err)
            assert.equal(res.text, fulfillment)
            assert.end()
          })
      })
    })
  })
})

Test('get fulfillment for transfer', function (assert) {
  let fulfillment = 'cf:0:_v8'
  let account1Name = generateAccountName()
  let account2Name = generateAccountName()

  createAccount(account1Name).then(() => {
    createAccount(account2Name).then(() => {
      let transferId = generateTransferId()
      prepareTransfer(transferId, buildTransfer(transferId, buildDebitOrCredit(account1Name, '25'), buildDebitOrCredit(account2Name, '25'))).then(() => {
        fulfillTransfer(transferId, fulfillment).then(() => {
          Request.get('/transfers/' + transferId + '/fulfillment')
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
            assert.pass()
            assert.end()
          })
      })
    })
  })
})

Test('return error when preparing existing transfer', function (assert) {
  let account1Name = generateAccountName()
  let account2Name = generateAccountName()

  createAccount(account1Name).then(() => {
    createAccount(account2Name).then(() => {
      let transferId = generateTransferId()
      let transfer = buildTransfer(transferId, buildDebitOrCredit(account1Name, '50'), buildDebitOrCredit(account2Name, '50'))
      prepareTransfer(transferId, transfer).then(() => {
        prepareTransfer(transferId, transfer)
          .expect(422, function (err, res) {
            if (err) return assert.end(err)
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
      assert.pass()
      assert.end()
    })
})

Test('return error when fulfilling already fulfilled transfer', function (assert) {
  let fulfillment = 'cf:0:_v8'
  let account1Name = generateAccountName()
  let account2Name = generateAccountName()

  createAccount(account1Name).then(() => {
    createAccount(account2Name).then(() => {
      let transferId = generateTransferId()
      prepareTransfer(transferId, buildTransfer(transferId, buildDebitOrCredit(account1Name, '25'), buildDebitOrCredit(account2Name, '25'))).then(() => {
        fulfillTransfer(transferId, fulfillment).then(() => {
          fulfillTransfer(transferId, fulfillment)
            .expect(422, function (err, res) {
              if (err) return assert.end(err)
              assert.pass()
              assert.end()
            })
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
    .expect('Content-Type', 'text/plain; charset=utf-8')
    .expect(200, function (err, res) {
      if (err) assert.end(err)
      assert.equal(res.text, reason)
      assert.end()
    })
})

Test('return net positions when preparing a settlement', function (assert) {
  let expectedResponseBody = {
    positions: [{
      account: 'http://central-ledger/accounts/dfsp10',
      net: '25',
      payments: '0',
      receipts: '25'
    }, {
      account: 'http://central-ledger/accounts/dfsp15',
      net: '-25',
      payments: '25',
      receipts: '0'
    }, {
      account: 'http://central-ledger/accounts/dfsp16',
      net: '25',
      payments: '0',
      receipts: '25'
    }, {
      account: 'http://central-ledger/accounts/dfsp7',
      net: '-25',
      payments: '25',
      receipts: '0'
    }, {
      account: 'http://central-ledger/accounts/dfsp8',
      net: '25',
      payments: '0',
      receipts: '25'
    }, {
      account: 'http://central-ledger/accounts/dfsp9',
      net: '-25',
      payments: '25',
      receipts: '0'
    }]
  }

  Request.post('/settlements')
    .send('')
    .expect(201, function (err, res) {
      if (err) assert.end(err)
      assert.deepEqual(res.body, expectedResponseBody)
      assert.end()
    })
})
