'use strict'

const Test = require('tape')
const Base = require('../../base')

Test('return error if required field missing', function (assert) {
  let fixtures = Base.setup()
  let req = Base.buildRequest('/register', 'POST', { identifier: 'dfsp1' })

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res, 'child "name" fails because ["name" is required]')
    assert.end()
  })
})
