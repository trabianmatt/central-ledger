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
