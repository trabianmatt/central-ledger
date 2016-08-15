'use strict'

const test = require('tape')
const server = require('../../src/app.js')

test('return subscription', function (t) {
  server.inject({ method: 'POST', url: '/subscriptions', payload: { } }, function (res) {
    t.equal(res.statusCode, 201)
    t.equal(res.result.id, '12345')
    server.stop(t.end)
  })
})
