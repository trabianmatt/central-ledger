'use strict'

const Logger = require('@leveloneproject/central-services-shared').Logger
const Util = require('util')
const Sidecar = require('./sidecar')

const logRequest = function (request) {
  const traceId = request.headers.traceid
  Logger.info(`L1p-Trace-Id=${traceId} - Method: ${request.method} Path: ${request.url.path} Query: ${JSON.stringify(request.query)}`)
  Logger.info(`L1p-Trace-Id=${traceId} - Headers: ${JSON.stringify(request.headers)}`)
  if (request.body) {
    Logger.info(`L1p-Trace-Id=${traceId} - Body: ${request.body}`)
  }
}

const logResponse = function (request) {
  const traceId = request.headers.traceid
  if (request.response) {
    let response
    try {
      response = JSON.stringify(request.response.source)
    } catch (e) {
      response = Util.inspect(request.response.source)
    }

    Logger.info(`L1p-Trace-Id=${traceId} - Response: ${response} Status: ${request.response.statusCode}`)
    Sidecar.write(`L1p-Trace-Id=${traceId} - Headers: ${JSON.stringify(request.headers)}`)
  }
}

const logWebsocket = function (data) {
  Logger.info(`Websocket: ${data}`)
}

module.exports = {
  logRequest,
  logResponse,
  logWebsocket
}