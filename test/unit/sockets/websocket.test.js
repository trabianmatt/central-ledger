'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const EventEmitter = require('events').EventEmitter
const SocketValidator = require('../../../src/sockets/validator')
const WebSocket = require('../../../src/sockets/websocket')

Test('WebSocket', socketTest => {
  let sandbox
  let socketManager

  socketTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(SocketValidator, 'validateSubscriptionRequest')
    socketManager = {
      add: sandbox.spy()
    }
    test.end()
  })

  socketTest.afterEach(test => {
    sandbox.restore()
    test.end()
  })

  socketTest.test('initialize should', initializeTest => {
    initializeTest.test('listen for incoming messages on socket', test => {
      const socket = {
        on: sandbox.spy()
      }

      WebSocket.initialize(socket, socketManager)

      test.ok(socket.on.calledWith('message'))
      test.end()
    })

    initializeTest.test('send error and close socket if subscription request is not valid', test => {
      const socket = new EventEmitter()
      socket.send = sandbox.spy()
      socket.close = sandbox.spy()
      const validationError = {
        payload: {
          id: 'ValidationError',
          message: 'Something bad'
        }
      }

      const request = 'some bad request'
      SocketValidator.validateSubscriptionRequest.withArgs(request).yields(validationError)

      WebSocket.initialize(socket, socketManager)

      socket.emit('message', request)
      test.ok(socket.send.calledWith(JSON.stringify(validationError.payload)))
      test.ok(socket.close.calledOnce)
      test.end()
    })

    initializeTest.test('reply to socket on valid request', test => {
      const socket = new EventEmitter()
      const id = 100
      const jsonrpc = 'jsonrpc'
      const accountUris = ['', '']
      socket.send = sandbox.spy()
      socket.close = sandbox.spy()
      const request = 'some request'
      SocketValidator.validateSubscriptionRequest.withArgs(request).yields(null, { id, jsonrpc, accountUris })

      WebSocket.initialize(socket, socketManager)
      socket.emit('message', request)

      test.ok(socket.send.calledWith(JSON.stringify({ id, jsonrpc, result: accountUris.length })))
      test.notOk(socket.close.called)
      test.end()
    })

    initializeTest.test('add socket to account listener if more than on account listed', test => {
      const socket = new EventEmitter()
      socket.send = sandbox.spy()
      const accountUris = ['', '']
      SocketValidator.validateSubscriptionRequest.yields(null, { id: 1, jsonrpc: '2.0', accountUris })

      WebSocket.initialize(socket, socketManager)
      socket.emit('message', 'some request')

      test.ok(socketManager.add.calledWith(socket, ...accountUris))
      test.end()
    })

    initializeTest.end()
  })

  socketTest.end()
})
