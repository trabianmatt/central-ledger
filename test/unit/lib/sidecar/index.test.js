'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Config = require(`${src}/lib/config`)
const Proxyquire = require('proxyquire')

Test('Sidecar', sidecarTest => {
  let oldSidecar
  let sidecarSettings = { HOST: 'local', PORT: 1234, CONNECT_TIMEOUT: 10000, RECONNECT_INTERVAL: 2000 }
  let sandbox
  let stubs
  let clientCreateStub
  let nullClientCreateStub

  sidecarTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()

    oldSidecar = Config.SIDECAR
    Config.SIDECAR = sidecarSettings
    Config.SIDECAR_DISABLED = false

    clientCreateStub = sandbox.stub()
    nullClientCreateStub = sandbox.stub()

    stubs = { './client': { create: clientCreateStub }, './null-client': { create: nullClientCreateStub } }

    t.end()
  })

  sidecarTest.afterEach(t => {
    sandbox.restore()
    Config.SIDECAR = oldSidecar
    t.end()
  })

  sidecarTest.test('import should', importTest => {
    importTest.test('return null client if sidecar disabled', test => {
      Config.SIDECAR_DISABLED = true
      Proxyquire(`${src}/lib/sidecar`, stubs)

      test.notOk(clientCreateStub.called)
      test.ok(nullClientCreateStub.calledOnce)
      test.end()
    })

    importTest.test('return sidecar client if not disabled', test => {
      Proxyquire(`${src}/lib/sidecar`, stubs)

      test.notOk(nullClientCreateStub.called)
      test.ok(clientCreateStub.calledOnce)
      test.ok(clientCreateStub.calledWith(sandbox.match({
        host: sidecarSettings.HOST,
        port: sidecarSettings.PORT,
        connectTimeout: sidecarSettings.CONNECT_TIMEOUT,
        reconnectInterval: sidecarSettings.RECONNECT_INTERVAL
      })))
      test.end()
    })

    importTest.end()
  })

  sidecarTest.end()
})
