'use strict'

const Client = require('./client')
const NullClient = require('./null-client')
const Config = require('../config')

const createClient = () => {
  if (Config.SIDECAR_DISABLED) {
    return NullClient.create()
  }

  return Client.create({
    host: Config.SIDECAR.HOST,
    port: Config.SIDECAR.PORT,
    connectTimeout: Config.SIDECAR.CONNECT_TIMEOUT,
    reconnectInterval: Config.SIDECAR.RECONNECT_INTERVAL
  })
}

module.exports = createClient()
