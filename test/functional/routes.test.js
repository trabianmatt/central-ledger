'use strict'

let host = process.env.HOST_IP || 'localhost'
let Request = require('supertest')('http://' + host + ':3000')
const Test = require('tape')

Test('return api documentation', function (assert) {
  Request.get('/documentation')
    .expect('Content-Type', /html/)
    .expect(200)
    .end(function (err, res) {
      if (err) return assert.end(err)
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
      if (err) assert.end(err)
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
  var account = {
    name: 'dfsp1'
  }

  Request.post('/accounts')
    .send(account)
    .expect('Content-Type', /json/)
    .expect(201, (err, res) => {
      if (err) assert.end(err)
      var expectedCreated = res.body.created
      assert.notEqual(expectedCreated, undefined)
      assert.equal(res.body.name, account.name)
      Request.get('/accounts/' + account.name)
        .expect('Content-Type', /json/)
        .expect(200, (err, getRes) => {
          if (err) return assert.end(err)
          assert.equal(account.name, getRes.body.name)
          assert.equal(expectedCreated, getRes.body.created)
          assert.equal(1000000.00, getRes.body.balance)
          assert.equal(false, getRes.body.is_disabled)
          assert.equal('http://central-ledger', getRes.body.ledger)
          assert.end()
        })
    })
})

Test('ensure a name can only be registered once', function (assert) {
  var account = {
    name: 'dfsp2'
  }

  Request.post('/accounts')
    .send(account)
    .expect('Content-Type', /json/)
    .expect(201, function (err, res) {
      if (err) assert.end(err)
      Request.post('/accounts')
        .send(account)
        .expect('Content-Type', /json/)
        .expect(400, function (err, res) {
          if (err) assert.end(err)
          assert.equal(res.body.statusCode, 400)
          assert.equal(res.body.error, 'Bad Request')
          assert.equal(res.body.message, 'The account has already been registered')
          assert.end()
        })
    })
})

Test('prepare a transfer', function (assert) {
  var account1 = { name: 'account1' }
  var account2 = { name: 'account2' }

  Request.post('/accounts').send(account1).then(() => {
    Request.post('/accounts').send(account2).then(() => {
      let transfer = {
        id: 'http://central-ledger/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204',
        ledger: 'http://central-ledger',
        debits: [{
          account: `http://central-ledger/accounts/${account1.name}`,
          amount: '50'
        }],
        credits: [{
          account: `http://central-ledger/accounts/${account2.name}`,
          amount: '50'
        }],
        execution_condition: 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2',
        expires_at: '2015-06-16T00:00:01.000Z'
      }

      Request.put('/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204')
        .send(transfer)
        .expect('Content-Type', /json/)
        .expect(201, function (err, res) {
          if (err) assert.end(err)
          assert.equal(res.body.id, transfer.id)
          assert.equal(res.body.ledger, transfer.ledger)
          assert.equal(res.body.debits[0].account, transfer.debits[0].account)
          assert.equal(res.body.debits[0].amount, parseInt(transfer.debits[0].amount))
          assert.equal(res.body.credits[0].account, transfer.credits[0].account)
          assert.equal(res.body.credits[0].amount, parseInt(transfer.credits[0].amount))
          assert.equal(res.body.execution_condition, transfer.execution_condition)
          assert.equal(res.body.expires_at, transfer.expires_at)
          assert.end()
        })
    })
  })
})

Test('fulfill a transfer', function (assert) {
  let fulfillment = 'cf:0:_v8'

  Request.put('/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204/fulfillment')
    .set('Content-Type', 'text/html; charset=utf-8')
    .send(fulfillment)
    .expect('Content-Type', 'text/html; charset=utf-8')
    .expect(200, function (err, res) {
      if (err) assert.end(err)
      assert.equal(res.text, fulfillment)
      assert.end()
    })
})

Test('return error when preparing existing transfer', function (assert) {
  let transfer = {
    id: 'http://central-ledger.example/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204',
    ledger: 'http://central-ledger.example',
    debits: [{
      account: 'http://central-ledger.example/accounts/dfsp1',
      amount: '50'
    }],
    credits: [{
      account: 'http://central-ledger.example/accounts/dfsp2',
      amount: '50'
    }],
    execution_condition: 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2',
    expires_at: '2015-06-16T00:00:01.000Z'
  }

  Request.put('/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204')
    .send(transfer)
    .expect(422, function (err, res) {
      if (err) assert.end(err)
      assert.pass()
      assert.end()
    })
})

Test('return error when fulfilling non-existing transfer', function (assert) {
  let fulfillment = 'cf:0:_v8'

  Request.put('/transfers/dea49356-57ea-440e-b0f7-a3809ad5b4ad/fulfillment')
    .set('Content-Type', 'text/html; charset=utf-8')
    .send(fulfillment)
    .expect(404, function (err, res) {
      if (err) assert.end(err)
      assert.pass()
      assert.end()
    })
})

Test('return error when fulfilling already fulfilled transfer', function (assert) {
  let fulfillment = 'cf:0:_v8'

  Request.put('/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204/fulfillment')
    .set('Content-Type', 'text/html; charset=utf-8')
    .send(fulfillment)
    .expect(422, function (err, res) {
      if (err) assert.end(err)
      assert.pass()
      assert.end()
    })
})

Test('reject a transfer', function (assert) {
  let reason = 'rejection reason'

  Request.put('/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204/rejection')
    .set('Content-Type', 'text/html; charset=utf-8')
    .send(reason)
    .expect('Content-Type', 'text/html; charset=utf-8')
    .expect(200, function (err, res) {
      if (err) assert.end(err)
      assert.equal(res.text, reason)
      assert.end()
    })
})
