'use strict'

const Test = require('tape')
const Permissions = require('../../../../src/admin/auth/permissions')
const Handler = require('../../../../src/admin/security/handler')

Test('Security handler', handlerTest => {
  handlerTest.test('getPermissions should', permissionsTest => {
    permissionsTest.test('return defined permissions', test => {
      const reply = (response) => {
        test.deepEqual(response, Object.keys(Permissions).map(x => Permissions[x]))
        test.end()
      }

      Handler.getPermissions({}, reply)
    })
    permissionsTest.end()
  })
  handlerTest.end()
})
