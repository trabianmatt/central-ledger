'use strict'

const Test = require('tape')
const Base = require('../../base')

Test('return error if required field missing', function (assert) {
  let fixtures = Base.setup()
  let req = Base.buildRequest('/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204', 'PUT', { })

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res, 'child "id" fails because ["id" is required]')
    assert.end()
  })
})
