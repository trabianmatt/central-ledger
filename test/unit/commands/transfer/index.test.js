'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Eventric = require('../../../../src/eventric')
const Transfer = require('../../../../src/commands/transfer')

Test('Eventric Transfer index test', indexTest => {
  let sandbox

  indexTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Eventric, 'getContext')
    t.end()
  })

  indexTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  indexTest.test('prepare should', prepareTest => {
    prepareTest.test('execute prepare command on context', t => {
      let command = sandbox.stub()
      let expected = {}
      command.returns(expected)
      Eventric.getContext.returns(P.resolve({ command: command }))

      let payload = {}

      Transfer.prepare(payload)
      .then(tfr => {
        t.ok(command.calledWith('PrepareTransfer', payload))
        t.equal(tfr, expected)
        t.end()
      })
    })

    prepareTest.end()
  })

  indexTest.test('fulfill should', fulfillTest => {
    fulfillTest.test('execute fulfill command on context', t => {
      let command = sandbox.stub()
      let expected = {}
      command.returns(expected)
      Eventric.getContext.returns(P.resolve({ command: command }))

      let payload = {}
      Transfer.fulfill(payload)
      .then(result => {
        t.ok(command.calledWith('FulfillTransfer', payload))
        t.equal(result, expected)
        t.end()
      })
    })
    fulfillTest.end()
  })

  indexTest.test('reject should', rejectTest => {
    rejectTest.test('execute reject command on context', t => {
      let command = sandbox.stub()
      let expected = {}
      command.returns(expected)
      Eventric.getContext.returns(P.resolve({ command: command }))

      let rejection = {}
      Transfer.reject(rejection)
      .then(result => {
        t.ok(command.calledWith('RejectTransfer', rejection))
        t.equal(result, expected)
        t.end()
      })
    })
    rejectTest.end()
  })

  indexTest.end()
})
