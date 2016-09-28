'use strict'

const Test = require('tape')
const Base = require('../../base')

Test('return error if required field missing on prepare', function (assert) {
  let fixtures = Base.setup()
  let req = Base.buildRequest('/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204', 'PUT', { })

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res, 'child "id" fails because ["id" is required]')
    assert.end()
  })
})

Test('return error if id is not a guid on prepare', function (assert) {
  let fixtures = Base.setup()

  let req = Base.buildRequest('/transfers/abcd', 'PUT')

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res, 'child "id" fails because ["id" must be a valid GUID]')
    assert.end()
  })
})

Test('return error if fulfillment missing', function (assert) {
  let fixtures = Base.setup()
  let req = Base.buildRequest('/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204/fulfillment', 'PUT', '')

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res, '"value" must be a string')
    assert.end()
  })
})

Test('return error if id is not a guid on fulfill', function (assert) {
  let fixtures = Base.setup()

  let req = Base.buildRequest('/transfers/abcd/fulfillment', 'PUT')

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res, 'child "id" fails because ["id" must be a valid GUID]')
    assert.end()
  })
})

Test('return error if reject reason missing', function (assert) {
  let fixtures = Base.setup()
  let req = Base.buildRequest('/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204/rejection', 'PUT', '')

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res, '"value" must be a string')
    assert.end()
  })
})

Test('return error if id is not a guid on rejection', function (assert) {
  let fixtures = Base.setup()

  let req = Base.buildRequest('/transfers/abcd/rejection', 'PUT')

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res, 'child "id" fails because ["id" must be a valid GUID]')
    assert.end()
  })
})
