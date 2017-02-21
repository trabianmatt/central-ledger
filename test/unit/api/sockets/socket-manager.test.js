'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const EventEmitter = require('events').EventEmitter
const SocketManager = require('../../../../src/api/sockets/socket-manager')

Test('SocketManager', managerTest => {
  let manager

  managerTest.beforeEach(test => {
    manager = SocketManager.create()
    test.end()
  })

  managerTest.afterEach(test => {
    manager = null
    test.end()
  })

  managerTest.test('add should', addTest => {
    addTest.test('add socket to socket listeners', test => {
      const accountName = 'http://test/accounts/dfsp1'
      const socket = Sinon.stub()
      socket.once = Sinon.spy()
      test.deepEqual(manager._sockets, [])
      manager.add(socket, accountName)
      test.deepEqual(manager._sockets, [socket])
      test.end()
    })

    addTest.test('add multiple accounts to socket', test => {
      const accountUris = ['one', 'two', 'three']
      const socket = {
        once: Sinon.spy()
      }

      test.deepEqual(manager._sockets, [])
      test.notOk(socket.accounts)

      manager.add(socket, ...accountUris)
      test.deepEqual(manager._sockets, [socket])
      test.deepEqual(socket.accounts, accountUris)
      test.end()
    })

    addTest.test('close socket if accounts length is 0', test => {
      const accounts = ['one', 'two', 'three']
      let closeCallCount = 0
      const socket = new EventEmitter()
      socket.close = () => {
        socket.emit('close')
        closeCallCount++
      }

      manager.add(socket, ...accounts)
      test.deepEqual(manager._sockets, [socket])
      test.deepEqual(socket.accounts, accounts)

      manager.add(socket, ...[])
      test.deepEqual(manager._sockets, [])
      test.equal(closeCallCount, 1)
      test.end()
    })

    addTest.test('not add socket if previously added', test => {
      const accountName = 'http://test/accounts/dfsp1'
      const socket = Sinon.stub()
      socket.once = Sinon.spy()
      test.deepEqual(manager._sockets, [])
      manager.add(socket, accountName)
      test.deepEqual(manager._sockets, [socket])
      manager.add(socket, accountName)
      test.deepEqual(manager._sockets, [socket])
      test.end()
    })

    addTest.test('listen to close event of added socket', test => {
      const accountName = 'http://test/accounts/dfsp1'
      const socket = Sinon.stub()
      socket.once = Sinon.spy()
      manager.add(socket, accountName)
      test.ok(socket.once.calledWith('close'))
      test.end()
    })

    addTest.test('remove socket when closed', test => {
      const accountName = 'http://test/accounts/dfsp1'
      const socket = new EventEmitter()
      manager.add(socket, accountName)
      test.deepEqual(manager._sockets, [socket])
      socket.emit('close')
      test.deepEqual(manager._sockets, [])
      test.end()
    })

    addTest.end()
  })

  managerTest.test('send should', sendTest => {
    sendTest.test('send message to each connected socket', test => {
      const accountName = 'http://test/accounts/dfsp1'
      const message = { value: 'message' }
      const socket = {
        once: Sinon.spy(),
        send: Sinon.spy()
      }

      manager.add(socket, accountName)
      test.equal(socket.send.called, false)

      manager.send(accountName, message)
      test.ok(socket.send.calledWith(Sinon.match(JSON.stringify(message))))
      test.end()
    })

    sendTest.test('not send message to wrong account', test => {
      const accountName = 'http://test/accounts/dfsp1'
      const wrongAccountName = accountName + '1'
      const socket = {
        once: Sinon.spy(),
        send: Sinon.spy()
      }

      manager.add(socket, accountName)
      test.equal(socket.send.called, false)
      manager.send(wrongAccountName, {})
      test.equal(socket.send.called, false)
      test.end()
    })

    sendTest.end()
  })

  managerTest.end()
})
