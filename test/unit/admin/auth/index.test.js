'use strict'

const Test = require('tape')
const Sinon = require('sinon')
const Config = require('../../../../src/lib/config')
const AdminStrategy = require('../../../../src/admin/auth/admin')
const TokenStrategy = require('../../../../src/admin/auth/token')

const AuthModule = require('../../../../src/admin/auth')

Test('Auth module', authTest => {
  authTest.test('should be named "admin auth"', test => {
    test.equal(AuthModule.register.attributes.name, 'admin auth')
    test.end()
  })

  authTest.test('register should', registerTest => {
    registerTest.test('add AdminStrategy to server auth strategies', test => {
      const strategySpy = Sinon.spy()
      const server = {
        auth: {
          strategy: strategySpy
        }
      }
      const next = () => {
        test.ok(strategySpy.calledWith(AdminStrategy.name, AdminStrategy.scheme, Sinon.match({ validate: AdminStrategy.validate })))
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

    registerTest.end()
  })

  authTest.test('tokenAuth should', tokenAuthTest => {
    tokenAuthTest.test('return token if ENABLE_TOKEN_AUTH true', test => {
      Config.ENABLE_TOKEN_AUTH = true
      test.equal(AuthModule.tokenAuth(), TokenStrategy.name)
      test.end()
    })

    tokenAuthTest.test('return false if ENABLE_TOKEN_AUTH is false', test => {
      Config.ENABLE_TOKEN_AUTH = false
      test.equal(AuthModule.tokenAuth(), false)
      test.end()
    })
    tokenAuthTest.end()
  })

  authTest.end()
})
