'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Promise = require('bluebird')
const WebToken = require('jsonwebtoken')
const Uuid = require('uuid4')
const Config = require('../../../../src/lib/config')
const Errors = require('../../../../src/errors')
const SecurityService = require('../../../../src/domain/security')
const JWT = require('../../../../src/domain/security/jwt')

Test('JWT', jwtTest => {
  let sandbox
  let tokenExpiration

  jwtTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(WebToken)
    sandbox.stub(SecurityService)
    tokenExpiration = Config.TOKEN_EXPIRATION
    test.end()
  })

  jwtTest.afterEach(test => {
    sandbox.restore()
    Config.TOKEN_EXPIRATION = tokenExpiration
    test.end()
  })

  jwtTest.test('create should', createTest => {
    createTest.test('throw error if user does not exist', test => {
      const userKey = 'kiy'
      SecurityService.getUserByKey.withArgs(userKey).returns(Promise.reject(new Errors.NotFoundError('User does not exist')))

      JWT.create(userKey)
        .then(() => test.fail('expected exception'))
        .catch(Errors.NotFoundError, e => {
          test.equal(e.message, 'User does not exist')
          test.end()
        })
        .catch(() => test.fail('Expected not found exception'))
    })

    createTest.test('return key signed with user', test => {
      const userKey = 'kiy'
      const userId = Uuid()
      const user = { userId, key: userKey }
      SecurityService.getUserByKey.withArgs(userKey).returns(Promise.resolve(user))

      const signedToken = 'signed-token'
      WebToken.sign.withArgs(Sinon.match({ userInfo: { userId } }), Config.ADMIN_SECRET).returns(signedToken)

      JWT.create(userKey)
        .then(result => {
          test.equal(result, signedToken)
          test.end()
        })
    })

    createTest.test('assign issuer and expiration to created token', test => {
      const userKey = 'key'
      const user = { userId: Uuid(), key: userKey }
      Config.TOKEN_EXPIRATION = 30000
      SecurityService.getUserByKey.returns(Promise.resolve(user))

      JWT.create(userKey)
        .then(() => {
          const signOptions = WebToken.sign.firstCall.args[2]
          test.equal(signOptions.algorithm, 'HS512')
          test.equal(signOptions.expiresIn, 30)
          test.equal(signOptions.issuer, Config.HOSTNAME)
          test.end()
        })
    })

    createTest.test('default expiresIn to 1 hour', test => {
      const userKey = 'key'
      const user = { userId: Uuid(), key: userKey }
      Config.TOKEN_EXPIRATION = null
      SecurityService.getUserByKey.returns(Promise.resolve(user))

      JWT.create(userKey)
        .then(() => {
          const signOptions = WebToken.sign.firstCall.args[2]
          test.equal(signOptions.expiresIn, 3600)
          test.end()
        })
    })

    createTest.end()
  })

  jwtTest.test('verify should', verifyTest => {
    verifyTest.test('throw error if token is invalid', test => {
      const token = 'bad token'
      const verifyError = new Error()
      WebToken.verify.withArgs(token, Config.ADMIN_SECRET).yields(verifyError)

      JWT.verify(token)
        .then(() => test.fail('Expected exception'))
        .catch(Errors.UnauthorizedError, e => {
          test.equal(e.message, 'Invalid token')
          test.end()
        })
        .catch(() => test.fail('Expected exception'))
    })

    verifyTest.test('throw error if user does not exist', test => {
      const token = 'token'
      const userId = Uuid()
      const decoded = { userInfo: { userId } }
      WebToken.verify.withArgs(token, Config.ADMIN_SECRET).yields(null, decoded)
      SecurityService.getUserById.withArgs(userId).returns(Promise.reject(new Errors.NotFoundError()))

      JWT.verify(token)
        .then(() => test.fail('expected exception'))
        .catch(Errors.UnauthorizedError, e => {
          test.equal(e.message, 'Invalid token')
          test.end()
        })
        .catch(() => test.fail('Expected exception'))
    })

    verifyTest.test('return user and roles for user', test => {
      const token = 'token'
      const userId = Uuid()
      const decoded = { userInfo: { userId } }
      WebToken.verify.withArgs(token, Config.ADMIN_SECRET).yields(null, decoded)
      const user = { userId }
      SecurityService.getUserById.withArgs(userId).returns(Promise.resolve(user))
      const roles = [{}, {}]
      SecurityService.getUserRoles.withArgs(userId).returns(Promise.resolve(roles))

      JWT.verify(token)
        .then(result => {
          test.deepEqual(result.user, user)
          test.deepEqual(result.roles, roles)
          test.end()
        })
    })

    verifyTest.end()
  })

  jwtTest.end()
})
