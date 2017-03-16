'use strict'

const Test = require('tape')
const Db = require('../../src/db')

Db.connect()

Test.onFinish(function () {
  Db.disconnect()
})
