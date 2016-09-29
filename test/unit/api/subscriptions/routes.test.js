'use strict'

const Test = require('tape')
const Base = require('../../base')

Test('return error if required field missing', function (assert) {
  let fixtures = Base.setup()
  let req = Base.buildRequest({ url: '/subscriptions', method: 'POST', payload: { url: 'http://test.com' } })

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res, 'child "secret" fails because ["secret" is required]')
    assert.end()
  })
})

Test('return error if invalid url', function (assert) {
  let fixtures = Base.setup()
  let req = Base.buildRequest({ url: '/subscriptions', method: 'POST', payload: { url: 'test.com' } })

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res, 'child "url" fails because ["url" must be a valid uri]')
    assert.end()
  })
})

Test('return error if id is not a guid', function (assert) {
  let fixtures = Base.setup()

  let req = Base.buildRequest({ url: '/subscriptions/abcd', method: 'GET' })

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res, 'child "id" fails because ["id" must be a valid GUID]')
    assert.end()
  })
})
