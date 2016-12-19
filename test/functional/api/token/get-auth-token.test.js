'use strict'

const Test = require('tape')
const Base = require('../../base')
const Fixtures = require('../../../fixtures')

Test('GET /auth_token', getTest => {
  getTest.test('should return token', test => {
    let accountName = Fixtures.generateAccountName()

    Base.createAccount(accountName)
    .then(res => {
      const key = res.body.credentials.key
      const secret = res.body.credentials.secret
      Base.get('/auth_token', Base.basicAuth(key, secret))
        .expect('Content-Type', /json/)
        .then(res => {
          const token = res.body.token
          test.ok(token)
          test.ok(token.length > 74)
          test.notEqual(token, key)
          test.notEqual(token, secret)
          test.end()
        })
    })
  })

  getTest.end()
})
