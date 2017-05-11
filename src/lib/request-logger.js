'use strict'

const Logger = require('@leveloneproject/central-services-shared').Logger

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
    Logger.info(`L1p-Trace-Id=${traceId} - Response: ${request.response}`)
  }
}

module.exports = {
  logRequest,
  logResponse
}
