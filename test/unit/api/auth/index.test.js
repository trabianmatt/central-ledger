'use strict'

const Test = require('tape')
const Sinon = require('sinon')
const Config = require('../../../../src/lib/config')
const AccountStrategy = require('../../../../src/api/auth/account')
const TokenStrategy = require('../../../../src/api/auth/token')
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

    registerTest.test('add TokenStrategy to server auth strategies', test => {
      const strategySpy = Sinon.spy()
      const server = {
        auth: {
          strategy: strategySpy
        }
      }

      const next = () => {
        test.ok(strategySpy.calledWith(TokenStrategy.name, TokenStrategy.scheme, Sinon.match({ validate: TokenStrategy.validate })))
        test.end()
      }

      AuthModule.register(server, {}, next)
    })
  })

  authTest.test('routeAuth should', routeAuthTest => {
    routeAuthTest.test('return token if ENABLE_TOKEN_AUTH true', test => {
      Config.ENABLE_TOKEN_AUTH = true
      test.equal(AuthModule.routeAuth(), 'token')
      test.end()
    })

    routeAuthTest.test('return false if ENABLE_TOKEN_AUTH is false', test => {
      Config.ENABLE_TOKEN_AUTH = false
      test.equal(AuthModule.routeAuth(), false)
      test.end()
    })
    routeAuthTest.end()
  })

  authTest.end()
})
