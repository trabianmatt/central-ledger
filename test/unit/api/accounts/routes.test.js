'use strict'

const Test = require('tape')
const Base = require('../../base')

Test('return error if required field missing', assert => {
  let fixtures = Base.setup()
  let req = Base.buildRequest('/accounts', 'POST', { })

  fixtures.server.inject(req, res => {
    Base.assertBadRequestError(assert, res, 'child "name" fails because ["name" is required]')
    assert.end()
  })
})

Test('return error if name is not a token', assert => {
  let fixtures = Base.setup()
  let req = Base.buildRequest('/accounts', 'POST', { name: 'this contains spaces' })

  fixtures.server.inject(req, res => {
    Base.assertBadRequestError(assert, res, 'child "name" fails because ["name" must only contain alpha-numeric and underscore characters]')
    assert.end()
  })
})

Test('return error if name is not a token', assert => {
  let fixtures = Base.setup()
  let req = Base.buildRequest('/accounts/some%20bad%20name', 'GET')

  fixtures.server.inject(req, res => {
    Base.assertBadRequestError(assert, res, 'child "name" fails because ["name" must only contain alpha-numeric and underscore characters]')
    assert.end()
  })
})