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

Test('Socket Module', moduleTest => {
  let sandbox
  let socketManager

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
      const server = {
        listener
      }
      Index.register(server, {}, () => {
        test.ok(WS.Server.called)
        test.end()
      })
    })

    registerTest.test('listen for WS connection events', test => {
      const wsServer = {
        on: sandbox.stub()
      }
      WS.Server.returns(wsServer)

      Index.register({}, {}, () => {
        test.ok(wsServer.on.calledWith('connection'))
        test.end()
      })
    })

    registerTest.test('Wire up event handlers', test => {
      WS.Server.returns(new EventEmitter())
      Index.register({}, {}, () => {
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

      Index.register({}, {}, () => {
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

      Index.register({}, {}, () => {
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
      Index.register({}, {}, () => {
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
      Index.register({}, {}, () => {
        test.ok(socketManager.send.calledWith(creditAccount, message))
        test.ok(socketManager.send.calledWith(debitAccount, message))
        test.end()
      })
    })

    eventsTest.test('onTransferExecuted should do nothing if transfer credits and debits are empty', test => {
      const message = { resource: {} }
      Events.onTransferExecuted.yields(message)
      Index.register({}, {}, () => {
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
      const message = { resource: transfer }
      Events.onTransferExecuted.yields(message)
      Index.register({}, {}, () => {
        test.ok(socketManager.send.calledWith(creditAccount, message))
        test.ok(socketManager.send.calledWith(debitAccount, message))
        test.end()
      })
    })

    eventsTest.test('onTransferRejected should do nothing if transfer credits and debits are empty', test => {
      const message = { resource: {} }
      Events.onTransferRejected.yields(message)
      Index.register({}, {}, () => {
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
      Index.register({}, {}, () => {
        test.ok(socketManager.send.calledWith(creditAccount, message))
        test.ok(socketManager.send.calledWith(debitAccount, message))
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
      Index.register({}, {}, () => {
        const args = socketManager.send.firstCall.args
        test.equal(args[0], toAccount)
        test.equal(args[1].jsonrpc, '2.0')
        test.equal(args[1].id, null)
        test.equal(args[1].method, 'notify')
        test.equal(args[1].params.event, 'message.send')
        test.ok(args[1].params.id)
        test.equal(args[1].params.resource, message)
        test.end()
      })
    })

    eventsTest.end()
  })

  moduleTest.end()
})
