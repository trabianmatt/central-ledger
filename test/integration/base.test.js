'use strict'

const Test = require('tape')
const Db = require('../../src/db')

Test('setup', setupTest => {
  setupTest.test('connect to database', test => {
    Db.connect().then(() => {
      test.pass()
      test.end()
    })
  })
  setupTest.end()
})

Test.onFinish(function () {
  Db.disconnect()
})
