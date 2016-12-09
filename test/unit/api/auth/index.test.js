'use strict'

const Test = require('tape')
const Sinon = require('sinon')
const AccountStrategy = require('../../../../src/api/auth/account')
const AuthModule = require('../../../../src/api/auth')

Test('Auth module', authTest => {
  authTest.test('should be named "auth"', test => {
    test.equal(AuthModule.register.attributes.name, 'auth')
    test.end()
  })

  authTest.test('register should', registerTest => {
    registerTest.test('add AccountStrategy to server auth strategies', test => {
      const strategySpy = Sinon.spy()
      const server = {
        auth: {
          strategy: strategySpy
        }
      }
      const next = () => {
        test.ok(strategySpy.calledWith(AccountStrategy.name, AccountStrategy.scheme, Sinon.match({ validate: AccountStrategy.validate })))
        test.end()
      }

      AuthModule.register(server, {}, next)
    })
  })
  authTest.end()
})
