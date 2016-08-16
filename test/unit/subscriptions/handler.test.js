'use strict'

const test = require('tape')
const base = require('../base')

test('return subscription', function (assert) {
  const fixtures = base.setup()
  const req = base.buildRequest('/subscriptions', 'POST')

  fixtures.server.inject(req, function (res) {
    assert.equal(res.statusCode, 201)
    assert.equal(res.result.id, '12345')
    assert.end()
  })
})
