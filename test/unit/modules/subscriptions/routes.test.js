'use strict'

const Test = require('tape')
const Base = require('../../base')

Test('return error if required field missing', function (assert) {
  let fixtures = Base.setup()
  let req = Base.buildRequest('/subscriptions', 'POST', { url: 'http://test.com' })

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res, 'child "secret" fails because ["secret" is required]')
    assert.end()
  })
})

Test('return error if invalid url', function (assert) {
  let fixtures = Base.setup()
  let req = Base.buildRequest('/subscriptions', 'POST', { url: 'test.com' })

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res, 'child "url" fails because ["url" must be a valid uri]')
    assert.end()
  })
})

Test('return error if id is not a guid', function (assert) {
  let fixtures = Base.setup()

  let req = Base.buildRequest('/subscriptions/abcd', 'GET')

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res, 'child "id" fails because ["id" must be a valid GUID]')
    assert.end()
  })
})
