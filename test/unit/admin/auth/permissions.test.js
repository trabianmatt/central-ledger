'use strict'

const Test = require('tape')
const Permissions = require('../../../../src/admin/auth/permissions')

Test('Permissions', permissionsTest => {
  permissionsTest.test('should contain Account permissions', test => {
    test.equal(Permissions.ACCOUNTS_GET.key, 'ACCOUNTS_GET')
    test.equal(Permissions.ACCOUNTS_UPDATE.key, 'ACCOUNTS_UPDATE')
    test.end()
  })
})
