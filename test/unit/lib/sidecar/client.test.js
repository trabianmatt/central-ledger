'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Net = require('net')
const EventEmitter = require('events')
const Logger = require('@leveloneproject/central-services-shared').Logger
const SidecarClient = require(`${src}/lib/sidecar/client`)

Test('SidecarClient', sidecarClientTest => {
  let sandbox
  let clock

  sidecarClientTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Logger)
    sandbox.stub(Net, 'Socket')

    clock = sandbox.useFakeTimers()

    t.end()
  })

  sidecarClientTest.afterEach(t => {
    sandbox.restore()
    clock.restore()
    t.end()
  })

  const writeMessageToBuffer = (msg) => {
    let message = Buffer.from(msg)
    let length = message.length

    let buffer = Buffer.alloc(4 + length)
    buffer.writeUInt32BE(length, 0)
    message.copy(buffer, 4)

    return buffer
  }

  sidecarClientTest.test('create should', createTest => {
    createTest.test('create new connection and set properties', test => {
      let settings = { host: 'test.com', port: 1234, connectTimeout: 9000, reconnectInterval: 2000 }
      let conn = SidecarClient.create(settings)

      test.equal(conn._host, settings.host)
      test.equal(conn._port, settings.port)
      test.equal(conn._connectTimeout, settings.connectTimeout)
      test.equal(conn._reconnectInterval, settings.reconnectInterval)
      test.end()
    })

    createTest.test('use default property values', test => {
      let conn = SidecarClient.create()

      test.equal(conn._host, 'localhost')
      test.equal(conn._port, 5678)
      test.equal(conn._connectTimeout, 30000)
      test.equal(conn._reconnectInterval, 5000)
      test.end()
    })

    createTest.end()
  })

  sidecarClientTest.test('connect should', connectTest => {
    connectTest.test('create socket connection and resolve when open', test => {
      let service = 'test'

      let settings = { port: 1234, host: 'local' }
      let client = SidecarClient.create(settings)

      let socketEmitter = new EventEmitter()
      socketEmitter.connect = sandbox.stub()
      socketEmitter.setKeepAlive = sandbox.stub()
      socketEmitter.write = sandbox.stub()
      Net.Socket.returns(socketEmitter)

      let connectPromise = client.connect(service)
      test.ok(Net.Socket.calledWithNew())
      test.notOk(client._connected)
      test.ok(socketEmitter.listenerCount('connect'), 1)
      test.ok(socketEmitter.listenerCount('error'), 1)
      test.equal(socketEmitter.listeners('error')[0].name.indexOf('_socketOnError'), -1)
      test.ok(socketEmitter.connect.calledWith(sandbox.match({
        port: settings.port,
        host: settings.host
      })))

      socketEmitter.emit('connect')

      connectPromise
        .then(() => {
          test.ok(client._connected)
          test.equal(socketEmitter.listenerCount('connect'), 0)
          test.equal(socketEmitter.listenerCount('close'), 1)
          test.equal(socketEmitter.listenerCount('error'), 1)
          test.notEqual(socketEmitter.listeners('error')[0].name.indexOf('_socketOnError'), -1)
          test.ok(socketEmitter.setKeepAlive.calledWith(true, 60000))
          test.notOk(client._connectTimer)
          test.notOk(client._reconnectTimer)
          test.notOk(client._connectPromise)
          test.ok(Logger.info.calledWith('Connected successfully to sidecar'))
          test.ok(socketEmitter.write.calledWith(writeMessageToBuffer(`Connected to Central Ledger - ${service}`)))
          test.end()
        })
    })

    connectTest.test('reject if connect timeout reached', test => {
      let settings = { port: 1234, host: 'local', connectTimeout: 5000 }
      let client = SidecarClient.create(settings)

      let socketEmitter = new EventEmitter()
      socketEmitter.connect = sandbox.stub()
      Net.Socket.returns(socketEmitter)

      let connectPromise = client.connect('test')
      test.ok(Net.Socket.calledWithNew())
      test.notOk(client._connected)
      test.ok(socketEmitter.listenerCount('connect'), 1)
      test.ok(socketEmitter.listenerCount('error'), 1)
      test.equal(socketEmitter.listeners('error')[0].name.indexOf('_socketOnError'), -1)

      clock.tick(settings.connectTimeout + 1)

      connectPromise
        .then(() => {
          test.fail('Should have thrown error')
          test.end()
        })
        .catch(err => {
          test.notOk(client._connected)
          test.equal(socketEmitter.listenerCount('connect'), 0)
          test.equal(socketEmitter.listenerCount('close'), 0)
          test.equal(socketEmitter.listenerCount('error'), 0)
          test.notOk(client._connectTimer)
          test.notOk(client._reconnectTimer)
          test.notOk(client._connectPromise)
          test.equal(err.message, `Unable to connect to sidecar within ${settings.connectTimeout}ms`)
          test.end()
        })
    })

    connectTest.test('reconnect if ECONNREFUSED error', test => {
      let service = 'test'

      let settings = { port: 1234, host: 'local', connectTimeout: 9000, reconnectInterval: 1000 }
      let client = SidecarClient.create(settings)

      let socketEmitter = new EventEmitter()
      socketEmitter.connect = sandbox.stub()
      socketEmitter.setKeepAlive = sandbox.stub()
      socketEmitter.write = sandbox.stub()
      Net.Socket.returns(socketEmitter)

      let connectPromise = client.connect(service)
      test.ok(Net.Socket.calledWithNew())
      test.notOk(client._connected)
      test.ok(socketEmitter.listenerCount('connect'), 1)
      test.ok(socketEmitter.listenerCount('error'), 1)
      test.equal(socketEmitter.listeners('error')[0].name.indexOf('_socketOnError'), -1)

      let error = new Error('Error connecting to websocket')
      error.code = 'ECONNREFUSED'
      socketEmitter.emit('error', error)

      test.ok(Logger.info.calledWith(`Error connecting to sidecar, attempting to connect after sleeping ${settings.reconnectInterval}ms`))

      clock.tick(settings.reconnectInterval + 1)

      socketEmitter.emit('connect')

      connectPromise
        .then(() => {
          test.ok(client._connected)
          test.equal(socketEmitter.listenerCount('connect'), 0)
          test.equal(socketEmitter.listenerCount('close'), 1)
          test.equal(socketEmitter.listenerCount('error'), 1)
          test.notEqual(socketEmitter.listeners('error')[0].name.indexOf('_socketOnError'), -1)
          test.ok(socketEmitter.setKeepAlive.calledWith(true, 60000))
          test.notOk(client._connectTimer)
          test.notOk(client._reconnectTimer)
          test.notOk(client._connectPromise)
          test.ok(Logger.info.calledWith('Connected successfully to sidecar'))
          test.ok(socketEmitter.write.calledWith(writeMessageToBuffer(`Connected to Central Ledger - ${service}`)))
          test.end()
        })
    })

    connectTest.test('reject if error event emitted', test => {
      let settings = { port: 1234, host: 'local' }
      let client = SidecarClient.create(settings)

      let socketEmitter = new EventEmitter()
      socketEmitter.connect = sandbox.stub()
      Net.Socket.returns(socketEmitter)

      let connectPromise = client.connect()
      test.ok(Net.Socket.calledWithNew())
      test.notOk(client._connected)
      test.ok(socketEmitter.listenerCount('connect'), 1)
      test.ok(socketEmitter.listenerCount('error'), 1)
      test.equal(socketEmitter.listeners('error')[0].name.indexOf('_socketOnError'), -1)

      let error = new Error('Error connecting to socket')
      socketEmitter.emit('error', error)

      connectPromise
        .then(() => {
          test.fail('Should have thrown error')
          test.end()
        })
        .catch(err => {
          test.notOk(client._connected)
          test.equal(socketEmitter.listenerCount('connect'), 0)
          test.equal(socketEmitter.listenerCount('close'), 0)
          test.equal(socketEmitter.listenerCount('error'), 0)
          test.notOk(client._connectTimer)
          test.notOk(client._reconnectTimer)
          test.notOk(client._connectPromise)
          test.equal(err, error)
          test.end()
        })
    })

    connectTest.test('return immediately if already connected', test => {
      let client = SidecarClient.create()
      client._connected = true

      client.connect()
        .then(() => {
          test.notOk(Net.Socket.calledOnce)
          test.end()
        })
    })

    connectTest.end()
  })

  sidecarClientTest.test('write should', writeTest => {
    writeTest.test('frame message with length and write to socket', test => {
      let client = SidecarClient.create()
      client._connected = true
      client._socket = { write: sandbox.stub() }

      let message = 'This is a test message'
      let buffer = writeMessageToBuffer(message)

      client.write(message)
      test.ok(client._socket.write.calledWith(buffer))
      test.end()
    })

    writeTest.test('not convert Buffer before writing', test => {
      let client = SidecarClient.create()
      client._connected = true
      client._socket = { write: sandbox.stub() }

      let message = 'This is a test message'
      let buffer = writeMessageToBuffer(message)

      client.write(Buffer.from(message))
      test.ok(client._socket.write.calledWith(buffer))
      test.end()
    })

    writeTest.test('throw error if client not connected', test => {
      let client = SidecarClient.create()

      try {
        client.write('test')
        test.fail('Should have thrown error')
        test.end()
      } catch (e) {
        test.equal(e.message, 'Sidecar is not connected')
        test.end()
      }
    })

    writeTest.end()
  })

  sidecarClientTest.test('receiving socket close event should', closeEventTest => {
    closeEventTest.test('log close details and mark disconnected', test => {
      let client = SidecarClient.create()

      let socketEmitter = new EventEmitter()
      socketEmitter.connect = sandbox.stub()
      socketEmitter.setKeepAlive = sandbox.stub()
      socketEmitter.write = sandbox.stub()
      Net.Socket.returns(socketEmitter)

      let connectPromise = client.connect()
      socketEmitter.emit('connect')

      connectPromise
        .then(() => {
          let hadError = true
          socketEmitter.emit('close', hadError)
          test.notOk(client._connected)
          test.ok(Logger.info.calledWith(`Sidecar socket connection closed: ${hadError}`))
          test.end()
        })
    })

    closeEventTest.end()
  })

  sidecarClientTest.test('receiving socket error event should', errorEventTest => {
    errorEventTest.test('log error and mark disconnected', test => {
      let client = SidecarClient.create()

      let socketEmitter = new EventEmitter()
      socketEmitter.connect = sandbox.stub()
      socketEmitter.setKeepAlive = sandbox.stub()
      socketEmitter.write = sandbox.stub()
      Net.Socket.returns(socketEmitter)

      let connectPromise = client.connect()
      socketEmitter.emit('connect')

      connectPromise
        .then(() => {
          let err = new Error()
          socketEmitter.emit('error', err)
          test.notOk(client._connected)
          test.ok(Logger.error.calledWith('Error on sidecar socket connection', err))
          test.end()
        })
    })

    errorEventTest.end()
  })

  sidecarClientTest.end()
})
