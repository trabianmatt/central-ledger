'use strict'

const ServicesLogger = require('@leveloneproject/central-services-shared').Logger
const cls = require('continuation-local-storage')
const ns = cls.getNamespace('trace')

const generateTraceIdMessage = () => {
  if (ns !== undefined) {
    const traceId = ns.get('headers').traceid
    return `L1P_TRACE_ID=${traceId} - `
  }
  return ''
}

const prependTraceIdMsg = (msg) => {
  const traceId = generateTraceIdMessage()
  return `${traceId}${msg}`
}

const debug = function (msg, ...args) {
  ServicesLogger.debug(prependTraceIdMsg(msg), ...args)
}

const info = function (msg, ...args) {
  ServicesLogger.info(prependTraceIdMsg(msg), ...args)
}

const warn = function (msg, ...args) {
  ServicesLogger.warn(prependTraceIdMsg(msg), ...args)
}

const error = function (msg, ...args) {
  ServicesLogger.error(prependTraceIdMsg(msg), ...args)
}

module.exports = {
  debug,
  info,
  warn,
  error
}
