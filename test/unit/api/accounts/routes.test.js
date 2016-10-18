'use strict'

const Test = require('tape')
const Base = require('../../base')

Test('return error if required field missing', assert => {
  let fixtures = Base.setup()
  let req = Base.buildRequest({ url: '/accounts', method: 'POST', payload: { } })

  fixtures.server.inject(req, res => {
    Base.assertBadRequestError(assert, res, [ { message: '"name" is required', path: 'name' } ])
    assert.end()
  })
})

Test('return error if name is not a token', assert => {
  let fixtures = Base.setup()
  let req = Base.buildRequest({ url: '/accounts', method: 'POST', payload: { name: 'this contains spaces' } })

  fixtures.server.inject(req, res => {
    Base.assertBadRequestError(assert, res, [ { message: '"name" must only contain alpha-numeric and underscore characters', path: 'name' } ])
    assert.end()
  })
})

Test('return error if name is not a token', assert => {
  let fixtures = Base.setup()
  let req = Base.buildRequest({ url: '/accounts/some%20bad%20name', method: 'GET' })

  fixtures.server.inject(req, res => {
    Base.assertBadRequestError(assert, res, [ { message: '"name" must only contain alpha-numeric and underscore characters', path: 'name' } ])
    assert.end()
  })
})
