'use strict'

const Test = require('tape')
const Db = require('../../src/lib/db')

Test.onFinish(function () {
  Db.connect().then(db => {
    db.end()
  })
})
