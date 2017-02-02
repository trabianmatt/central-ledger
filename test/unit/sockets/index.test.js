'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const EventEmitter = require('events').EventEmitter
const WS = require('ws')
const Index = require('../../../src/sockets')
const SocketManager = require('../../../src/sockets/socket-manager')
const Events = require('../../../src/lib/events')
const WebSocket = require('../../../src/sockets/websocket')
const AccountTransfers = require('../../../src/sockets/account-transfers')

const assertEvent = (assert, message, event, resource, relatedResources) => {
  assert.equal(message.jsonrpc, '2.0')
  assert.equal(message.id, null)
  assert.equal(message.method, 'notify')
  const params = message.params
  assert.equal(params.event, event)
  assert.ok(params.id)
  assert.deepEqual(params.resource, resource)
  if (relatedResources) {
    assert.deepEqual(params.related_resources, relatedResources)
  } else {
    assert.equal(params.hasOwnProperty('related_resources'), false)
  }
}

Test('Socket Module', moduleTest => {
  let sandbox
  let socketManager

  const mockServer = (listener = {}, serverTag = 'api') => {
    const server = {
      select: sandbox.stub()
    }
    server.select.withArgs(serverTag).returns({ listener })
    return server
  }

  moduleTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(WS, 'Server')
    socketManager = {
      send: sandbox.stub()
    }
    sandbox.stub(SocketManager, 'create')
    sandbox.stub(Events)
    SocketManager.create.returns(socketManager)
    sandbox.stub(WebSocket, 'initialize')
    sandbox.stub(AccountTransfers, 'initialize')
    test.end()
  })

  moduleTest.afterEach(test => {
    sandbox.restore()
    test.end()
  })

  moduleTest.test('register should', registerTest => {
    registerTest.test('create new instance of WS.Server', test => {
      const listener = {}

      WS.Server.withArgs(Sinon.match({ server: listener })).returns(new EventEmitter())

      Index.register(mockServer(listener), {}, () => {
        test.ok(WS.Server.called)
        test.end()
      })
    })

    registerTest.test('listen for WS connection events', test => {
      const wsServer = {
        on: sandbox.stub()
      }
      WS.Server.returns(wsServer)

      Index.register(mockServer(), {}, () => {
        test.ok(wsServer.on.calledWith('connection'))
        test.end()
      })
    })

    registerTest.test('Wire up event handlers', test => {
      WS.Server.returns(new EventEmitter())
      Index.register(mockServer(), {}, () => {
        test.ok(Events.onTransferExecuted.called)
        test.ok(Events.onTransferPrepared.called)
        test.end()
      })
    })

    registerTest.end()
  })

  moduleTest.test('on socket connection should', connectionTest => {
    connectionTest.test('initialize WebSocket if url is /websocket', test => {
      const ws = {
        upgradeReq: {
          url: '/websocket'
        }
      }
      const wsServer = new EventEmitter()
      WS.Server.returns(wsServer)

      Index.register(mockServer(), {}, () => {
        wsServer.emit('connection', ws)
        test.ok(WebSocket.initialize.calledWith(ws, Sinon.match(socketManager)))
        test.notOk(AccountTransfers.initialize.called)
        test.end()
      })
    })

    connectionTest.test('initialize AccountTransfers if url is not /websocket', test => {
      const url = '/notwebsocket'
      const ws = {
        upgradeReq: {
          url
        }
      }
      const wsServer = new EventEmitter()
      WS.Server.returns(wsServer)

      Index.register(mockServer(), {}, () => {
        wsServer.emit('connection', ws)
        test.ok(AccountTransfers.initialize.calledWith(ws, url, Sinon.match(socketManager)))
        test.notOk(WebSocket.initialize.called)
        test.end()
      })
    })

    connectionTest.end()
  })

  moduleTest.test('Events should', eventsTest => {
    eventsTest.beforeEach(test => {
      WS.Server.returns(new EventEmitter())
      test.end()
    })

    eventsTest.test('onTransferPrepared should do nothing if transfer credits and debits are empty', test => {
      const message = { resource: {} }
      Events.onTransferPrepared.yields(message)
      Index.register(mockServer(), {}, () => {
        test.equal(socketManager.send.callCount, 0)
        test.end()
      })
    })

    eventsTest.test('onTransferPrepared should send message to socket manager for each account', test => {
      const creditAccount = 'http://credit-account'
      const debitAccount = 'http://debit-account'
      const transfer = {
        credits: [
          { account: creditAccount }
        ],
        debits: [
          { account: debitAccount }
        ]
      }
      const message = { resource: transfer }
      Events.onTransferPrepared.yields(message)
      Index.register(mockServer(), {}, () => {
        const creditAccountSendArgs = socketManager.send.firstCall.args
        test.equal(creditAccountSendArgs[0], creditAccount)
        assertEvent(test, creditAccountSendArgs[1], 'transfer.create', transfer)

        const debitAccountSendArgs = socketManager.send.secondCall.args
        test.equal(debitAccountSendArgs[0], debitAccount)
        assertEvent(test, debitAccountSendArgs[1], 'transfer.create', transfer)
        test.end()
      })
    })

    eventsTest.test('onTransferExecuted should do nothing if transfer credits and debits are empty', test => {
      const message = { resource: {} }
      Events.onTransferExecuted.yields(message)
      Index.register(mockServer(), {}, () => {
        test.equal(socketManager.send.callCount, 0)
        test.end()
      })
    })

    eventsTest.test('onTransferExecuted should send message to socket manager for each account', test => {
      const creditAccount = 'http://credit-account'
      const debitAccount = 'http://debit-account'
      const transfer = {
        credits: [
          { account: creditAccount }
        ],
        debits: [
          { account: debitAccount }
        ]
      }
      const relatedResources = { execution_condition_fulfillment: 'aaaa' }
      const message = { resource: transfer, related_resources: relatedResources }
      Events.onTransferExecuted.yields(message)
      Index.register(mockServer(), {}, () => {
        const creditAccountSendArgs = socketManager.send.firstCall.args
        test.equal(creditAccountSendArgs[0], creditAccount)
        assertEvent(test, creditAccountSendArgs[1], 'transfer.update', transfer, relatedResources)

        const debitAccountSendArgs = socketManager.send.secondCall.args
        test.equal(debitAccountSendArgs[0], debitAccount)
        assertEvent(test, debitAccountSendArgs[1], 'transfer.update', transfer, relatedResources)
        test.end()
      })
    })

    eventsTest.test('onTransferRejected should do nothing if transfer credits and debits are empty', test => {
      const message = { resource: {} }
      Events.onTransferRejected.yields(message)
      Index.register(mockServer(), {}, () => {
        test.equal(socketManager.send.callCount, 0)
        test.end()
      })
    })

    eventsTest.test('onTransferRejected should send message to socket manager for each account', test => {
      const creditAccount = 'http://credit-account'
      const debitAccount = 'http://debit-account'
      const transfer = {
        credits: [
          { account: creditAccount }
        ],
        debits: [
          { account: debitAccount }
        ]
      }
      const message = { resource: transfer }
      Events.onTransferRejected.yields(message)
      Index.register(mockServer(), {}, () => {
        const creditAccountSendArgs = socketManager.send.firstCall.args
        test.equal(creditAccountSendArgs[0], creditAccount)
        assertEvent(test, creditAccountSendArgs[1], 'transfer.update', transfer)

        const debitAccountSendArgs = socketManager.send.secondCall.args
        test.equal(debitAccountSendArgs[0], debitAccount)
        assertEvent(test, debitAccountSendArgs[1], 'transfer.update', transfer)
        test.end()
      })
    })

    eventsTest.test('onMessageSent should send message to socket manager for to account', test => {
      const toAccount = 'http://to-account'
      const fromAccount = 'http://from-account'
      const data = { something: 'test' }
      const message = {
        to: toAccount,
        from: fromAccount,
        data
      }
      Events.onMessageSent.yields(message)
      Index.register(mockServer(), {}, () => {
        const args = socketManager.send.firstCall.args
        test.equal(args[0], toAccount)
        assertEvent(test, args[1], 'message.send', message)
        test.end()
      })
    })

    eventsTest.end()
  })

  moduleTest.end()
})
