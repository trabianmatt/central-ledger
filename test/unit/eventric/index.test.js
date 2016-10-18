'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Eventric = require('eventric')
const P = require('bluebird')
const Index = require('../../../src/eventric/index')
const PostgresStore = require('../../../src/eventric/postgres-store')
const TransferInitialize = require('../../../src/eventric/transfer/initialize')

Test('Eventric index', indexTest => {
  let sandbox

  indexTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Eventric, 'context')
    sandbox.stub(Eventric, 'setStore')
    sandbox.stub(TransferInitialize, 'setupContext')
    sandbox.stub(TransferInitialize, 'onContextInitialized')
    t.end()
  })

  indexTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  indexTest.test('getContext should', ctxTest => {
    ctxTest.test('Setup default store and configure transfer', t => {
      let stubCtx = {
        initialize: () => P.resolve()
      }

      Eventric.context.returns(stubCtx)

      Index.getContext()
      .then(ctx => {
        t.ok(Eventric.setStore.calledWith(PostgresStore.default, {}))
        t.ok(TransferInitialize.setupContext.calledWith(stubCtx))
        t.ok(TransferInitialize.onContextInitialized.calledWith(stubCtx))
        t.end()
      })
    })
    ctxTest.end()
  })

  indexTest.end()
})
