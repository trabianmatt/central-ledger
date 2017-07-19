'use strict'

const Net = require('net')
const P = require('bluebird')
const Logger = require('@leveloneproject/central-services-shared').Logger

class Sidecar {
  constructor (settings) {
    this._host = settings.host || 'localhost'
    this._port = settings.port || 5678
    this._connectTimeout = settings.connectTimeout || 30000
    this._reconnectInterval = settings.reconnectInterval || 5000

    this._service = null
    this._connected = false
    this._connectPromise = null
    this._connectTimer = null
    this._reconnectTimer = null
  }

  connect (service) {
    return new P((resolve, reject) => {
      if (this._connected) {
        return resolve(this)
      }

      this._service = service
      this._connectPromise = { resolve, reject }

      this._connectTimer = setTimeout(this._connectTimedOut.bind(this), this._connectTimeout)

      this._connect()
    })
  }

  write (msg) {
    if (!this._connected) {
      throw new Error('Sidecar is not connected')
    }

    let message = Buffer.isBuffer(msg) ? msg : Buffer.from(msg)
    let length = message.length

    let buffer = Buffer.alloc(4 + length)
    buffer.writeUInt32BE(length, 0)
    message.copy(buffer, 4)
    this._socket.write(buffer)
  }

  _connect () {
    const connectErrorListener = (err) => {
      this._socket.removeAllListeners()

      switch (err.code) {
        case 'ECONNREFUSED':
          Logger.info(`Error connecting to sidecar, attempting to connect after sleeping ${this._reconnectInterval}ms`)

          let self = this
          this._reconnectTimer = setTimeout(() => {
            self._connect()
          }, this._reconnectInterval)
          break
        default:
          this._clearConnectionTimers()
          this._connectError(err)
      }
    }

    this._socket = new Net.Socket()

    this._socket.once('connect', () => {
      this._connected = true
      this._clearConnectionTimers()

      // Remove listener only used for connect problems.
      this._socket.removeListener('error', connectErrorListener)

      this._socket.on('close', this._socketOnClose.bind(this))
      this._socket.on('error', this._socketOnError.bind(this))

      this._socket.setKeepAlive(true, 60000)

      this.write(`Connected to Central Ledger - ${this._service}`)
      Logger.info('Connected successfully to sidecar')

      this._connectSuccessful(this)
    })

    this._socket.once('error', connectErrorListener)

    this._socket.connect({ port: this._port, host: this._host })
  }

  _connectTimedOut () {
    this._socket.removeAllListeners()
    this._clearConnectionTimers()
    this._connectError(new Error(`Unable to connect to sidecar within ${this._connectTimeout}ms`))
  }

  _connectError (err) {
    this._connectPromise.reject(err)
    this._connectPromise = null
  }

  _connectSuccessful (obj) {
    this._connectPromise.resolve(obj)
    this._connectPromise = null
  }

  _clearConnectionTimers () {
    clearTimeout(this._connectTimer)
    this._connectTimer = null

    clearTimeout(this._reconnectTimer)
    this._reconnectTimer = null
  }

  _socketOnError (err) {
    Logger.error('Error on sidecar socket connection', err)
    this._connected = false
  }

  _socketOnClose (hadError) {
    Logger.info(`Sidecar socket connection closed: ${hadError}`)
    this._connected = false
  }
}

exports.create = (settings) => {
  return new Sidecar(settings || {})
}
