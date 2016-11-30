'use strict'

const Test = require('tape')
const Base = require('../../base')
const Fixtures = require('../../../fixtures')

Test('return metadata', function (assert) {
  Base.get('/')
    .expect(200)
    .expect('Content-Type', /json/)
    .then(res => {
      assert.equal(res.body.currency_code, null)
      assert.equal(res.body.currency_symbol, null)
      assert.equal(res.body.precision, 10)
      assert.equal(res.body.scale, 2)
      assert.equal(Object.keys(res.body.urls).length, 9)
      assert.equal(res.body.urls.health, `http://${Fixtures.hostname}/health`)
      assert.equal(res.body.urls.account, `http://${Fixtures.hostname}/accounts/:name`)
      assert.equal(res.body.urls.accounts, `http://${Fixtures.hostname}/accounts`)
      assert.equal(res.body.urls.transfer, `http://${Fixtures.hostname}/transfers/:id`)
      assert.equal(res.body.urls.transfer_fulfillment, `http://${Fixtures.hostname}/transfers/:id/fulfillment`)
      assert.equal(res.body.urls.transfer_rejection, `http://${Fixtures.hostname}/transfers/:id/rejection`)
      assert.equal(res.body.urls.notifications, `ws://${Fixtures.hostname}/websocket`)
      assert.equal(res.body.urls.send_message, `http://${Fixtures.hostname}/messages`)
      assert.equal(res.body.urls.positions, `http://${Fixtures.hostname}/positions`)
      assert.end()
    })
})

Test('return api documentation', function (assert) {
  Base.get('/documentation')
    .expect(200)
    .expect('Content-Type', /html/)
    .then(res => {
      assert.end()
    })
})

Test('return health', function (assert) {
  Base.get('/health')
    .expect(200)
    .expect('Content-Type', /json/)
    .then(res => {
      assert.equal(res.body.status, 'OK')
      assert.end()
    })
})
