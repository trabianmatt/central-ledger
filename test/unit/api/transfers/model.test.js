'use strict'

const Test = require('tape')
const Proxyquire = require('proxyquire')
const Sinon = require('sinon')

function createModel (db) {
  return Proxyquire('../../../../src/api/transfers/model', {
    '../../lib/eventric': db
  })
}

function setupEventric (context) {
  return {
    getContext: () => Promise.resolve(context)
  }
}

Test('transfer model', function (modelTest) {
  modelTest.test('create should', function (createTest) {
    createTest.test('send CreateTransfer command', function (assert) {
      let command = Sinon.stub()
      let model = createModel(setupEventric({ command: command }))
      let payload = {
        id: 'https://central-ledger/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204',
        ledger: 'http://usd-ledger.example/USD',
        debits: [
          {
            account: 'http://usd-ledger.example/USD/accounts/alice',
            amount: '50'
          }
        ],
        credits: [
          {
            account: 'http://usd-ledger.example/USD/accounts/bob',
            amount: '50'
          }
        ],
        execution_condition: 'cc:0:3:8ZdpKBDUV-KX_OnFZTsCWB_5mlCFI3DynX5f5H2dN-Y:2',
        expires_at: '2015-06-16T00:00:01.000Z'
      }
      model.create(payload)
        .then(() => {
          let commandArg1 = command.firstCall.args[0]
          let commandArg2 = command.firstCall.args[1]
          assert.equal(commandArg1, 'ProposeTransfer')
          assert.equal(commandArg2.id, payload.id)
          assert.equal(commandArg2.ledger, payload.ledger)
          assert.deepEqual(commandArg2.debits, payload.debits)
          assert.deepEqual(commandArg2.credits, payload.credits)
          assert.equal(commandArg2.execution_condition, payload.execution_condition)
          assert.equal(commandArg2.expires_at, payload.expires_at)
          assert.end()
        })
    })

    createTest.end()
  })

  modelTest.end()
})
