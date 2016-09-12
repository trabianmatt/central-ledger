'use strict'

const Request = require('supertest')('http://central-ledger:3000')
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
  var subscription = {
    'url': 'http://localhost/blah',
    'secret': 'secret'
  }

  Request.post('/subscriptions')
    .send(subscription)
    .expect('Content-Type', /json/)
    .expect(201, function (err, res) {
      if (err) assert.end(err)
      var expectedId = res.body.id
      var expectedUrl = res.body.url
      var expectedCreated = res.body.created
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

Test('register a dfsp', function (assert) {
  var registration = {
    identifier: 'dfsp1',
    name: 'The DFSP'
  }

  Request.post('/register')
    .send(registration)
    .expect('Content-Type', /json/)
    .expect(201, function (err, res) {
      if (err) assert.end(err)
      assert.equal(res.body.identifier, registration.identifier)
      assert.equal(res.body.name, registration.name)
      assert.notEqual(res.body.created, undefined)
      assert.end()
    })
})

Test('ensure an identifier can only be registered once', function (assert) {
  var registration = {
    identifier: 'dfsp2',
    name: 'The DFSP'
  }

  Request.post('/register')
    .send(registration)
    .expect('Content-Type', /json/)
    .expect(201, function (err, res) {
      if (err) assert.end(err)
      Request.post('/register')
        .send(registration)
        .expect('Content-Type', /json/)
        .expect(400, function (err, res) {
          if (err) assert.end(err)
          assert.equal(res.body.statusCode, 400)
          assert.equal(res.body.error, 'Bad Request')
          assert.equal(res.body.message, 'The identifier has already been registered')
          assert.end()
        })
    })
})

Test('create a transfer', function (assert) {
  var transfer = {
    amount: '11.11'
  }

  Request.post('/transfers')
    .send(transfer)
    .expect('Content-Type', /json/)
    .expect(201, function (err, res) {
      if (err) assert.end(err)
      assert.equal(res.body.amount, transfer.amount)
      assert.end()
    })
})
