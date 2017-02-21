'use strict'

const Test = require('tape')

const Routes = require('../../../../src/admin/root/routes')

Test('health handler should', healthTest => {
  healthTest.test('return status OK', test => {
    const reply = (response) => {
      test.deepEqual(response, { status: 'OK' })
      return {
        code: (statusCode) => {
          test.equal(statusCode, 200)
          test.end()
        }
      }
    }

    Routes[0].handler({}, reply)
  })
  healthTest.end()
})
