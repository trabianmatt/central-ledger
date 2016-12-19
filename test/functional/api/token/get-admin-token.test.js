'use strict'

const Test = require('tape')
const Base = require('../../base')

Test('GET /admin_token', getTest => {
  getTest.test('should return token', test => {
    Base.get('/admin_token', Base.basicAuth('admin', 'admin'))
      .expect('Content-Type', /json/)
      .then(res => {
        const token = res.body.token
        test.ok(token)
        test.ok(token.length > 74)
        test.notEqual(token, 'admin')
        test.end()
      })
  })

  getTest.end()
})
