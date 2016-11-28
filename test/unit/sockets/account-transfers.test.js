'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const AccountService = require('../../../src/domain/account')
const UrlParser = require('../../../src/lib/urlparser')
const ValidationError = require('../../../src/errors/validation-error')
const AccountTransfers = require('../../../src/sockets/account-transfers')

Test('AccountTransfers', transfersTest => {
  let sandbox
  let socketManager

  transfersTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(AccountService, 'exists')

    socketManager = {
      add: sandbox.spy()
    }
    test.end()
  })

  transfersTest.afterEach(test => {
    sandbox.restore()
    test.end()
  })

  transfersTest.test('initialize should', initializeTest => {
    initializeTest.test('send error and close socket if account is not valid url', test => {
      const socket = {
        send: sandbox.spy(),
        close: sandbox.spy()
      }
      const url = 'not a valid account url'

      AccountTransfers.initialize(socket, url, socketManager)
      .then(() => {
        test.ok(socket.send.calledWith(JSON.stringify({ id: 'NotFoundError', message: 'The requested account does not exist' })))
        test.ok(socket.close.calledOnce)
        test.end()
      })
    })

    initializeTest.test('send error and close socket if account does not exist', test => {
      const name = 'dfsp1'
      AccountService.exists.returns(P.reject(new ValidationError(`Account ${name} not found`)))

      const url = `/accounts/${name}/transfers`
      const socket = {
        send: sandbox.spy(),
        close: sandbox.spy()
      }

      AccountTransfers.initialize(socket, url, socketManager)
      .then(() => {
        const sendArg = socket.send.firstCall.args[0]
        test.equal(sendArg, JSON.stringify({ id: 'NotFoundError', message: `Account ${name} not found` }))
        test.ok(socket.close.calledOnce)
        test.end()
      })
    })

    initializeTest.test('add socket and url to socketManager', test => {
      const name = 'dfsp1'
      const accountUri = UrlParser.toAccountUri(name)
      AccountService.exists.returns(P.resolve({}))

      const url = `/accounts/${name}/transfers`
      const socket = {
        send: sandbox.spy(),
        close: sandbox.spy()
      }
      AccountTransfers.initialize(socket, url, socketManager)
      .then(() => {
        test.ok(socketManager.add.calledWith(socket, accountUri))
        test.notOk(socket.close.called)
        test.end()
      })
    })

    initializeTest.end()
  })

  transfersTest.end()
})
