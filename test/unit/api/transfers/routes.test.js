'use strict'

const Test = require('tape')
const Base = require('../../base')

Test('return error if required field missing on prepare', function (assert) {
  let fixtures = Base.setup()
  let req = Base.buildRequest({ url: '/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204', method: 'PUT', payload: { } })

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res, 'child "id" fails because ["id" is required]')
    assert.end()
  })
})

Test('return error if id is not a guid on prepare', function (assert) {
  let fixtures = Base.setup()

  let req = Base.buildRequest({ url: '/transfers/abcd', method: 'PUT' })

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res, 'child "id" fails because ["id" must be a valid GUID]')
    assert.end()
  })
})

Test('return error if id is not a guid on get prepare', function (assert) {
  let fixtures = Base.setup()

  let req = Base.buildRequest({ url: '/transfers/abcd', method: 'GET' })

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res, 'child "id" fails because ["id" must be a valid GUID]')
    assert.end()
  })
})

Test('return error if invalid content type on fulfillment', function (assert) {
  let fixtures = Base.setup()
  let req = Base.buildRequest({ url: '/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204/fulfillment', method: 'PUT', headers: { 'Content-Type': 'application/json' } })

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res, 'child "content-type" fails because ["content-type" must be one of [text/plain]]')
    assert.end()
  })
})

Test('return error if fulfillment missing', function (assert) {
  let fixtures = Base.setup()
  let req = Base.buildRequest({ url: '/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204/fulfillment', method: 'PUT', headers: { 'Content-Type': 'text/plain' } })

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res, '"value" must be a string')
    assert.end()
  })
})

Test('return error if id is not a guid on fulfill', function (assert) {
  let fixtures = Base.setup()

  let req = Base.buildRequest({ url: '/transfers/abcd/fulfillment', method: 'PUT', headers: { 'Content-Type': 'text/plain' } })

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res, 'child "id" fails because ["id" must be a valid GUID]')
    assert.end()
  })
})

Test('return error if reject reason missing', function (assert) {
  let fixtures = Base.setup()
  let req = Base.buildRequest({ url: '/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204/rejection', method: 'PUT', payload: '', headers: { 'Content-Type': 'text/plain' } })

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res, '"value" must be a string')
    assert.end()
  })
})

Test('return error if invalid content type on rejection', function (assert) {
  let fixtures = Base.setup()
  let req = Base.buildRequest({ url: '/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204/rejection', method: 'PUT', headers: { 'Content-Type': 'application/json' } })

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res, 'child "content-type" fails because ["content-type" must be one of [text/plain]]')
    assert.end()
  })
})

Test('return error if id is not a guid on rejection', function (assert) {
  let fixtures = Base.setup()

  let req = Base.buildRequest({ url: '/transfers/abcd/rejection', method: 'PUT', headers: { 'Content-Type': 'text/plain' } })

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res, 'child "id" fails because ["id" must be a valid GUID]')
    assert.end()
  })
})

Test('return error if id is not a guid on get fulfillment', function (assert) {
  let fixtures = Base.setup()

  let req = Base.buildRequest({ url: '/transfers/abcd/fulfillment', method: 'GET', headers: { 'Content-Type': 'text/plain' } })

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res, 'child "id" fails because ["id" must be a valid GUID]')
    assert.end()
  })
})
