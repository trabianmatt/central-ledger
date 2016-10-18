'use strict'

const src = '../../../../src'
const Sinon = require('sinon')
const Test = require('tapes')(require('tape'))
const P = require('bluebird')
const TransfersReadModel = require(`${src}/models/transfers-read-model`)
const Handler = require(`${src}/api/positions/handler`)

Test('positions handler', (handlerTest) => {
  let sandbox

  handlerTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    t.end()
  })

  handlerTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  handlerTest.test('prepare should', (prepareTest) => {
    prepareTest.test('return no positions if no executed transfers exist', (assert) => {
      sandbox.stub(TransfersReadModel, 'getExecuted').returns(P.resolve([]))

      let expectedResponse = { positions: [] }
      let reply = function (response) {
        assert.deepEqual(response, expectedResponse)
        return {
          code: function (statusCode) {
            assert.equal(statusCode, 200)
            assert.end()
          }
        }
      }
      Handler.perform('', reply)
    })

    prepareTest.test('return expected positions if executed transfers exist', (assert) => {
      let transfers = [
        {
          debitAccount: 'account1',
          debitAmount: '3',
          creditAccount: 'account2',
          creditAmount: '3'
        },
        {
          debitAccount: 'account1',
          debitAmount: '2',
          creditAccount: 'account3',
          creditAmount: '2'
        }
      ]
      sandbox.stub(TransfersReadModel, 'getExecuted').returns(P.resolve(transfers))

      let expectedResponse = { positions: [
        {
          account: 'account1',
          payments: '5',
          receipts: '0',
          net: '-5'
        },
        {
          account: 'account2',
          payments: '0',
          receipts: '3',
          net: '3'
        },
        {
          account: 'account3',
          payments: '0',
          receipts: '2',
          net: '2'
        }
      ] }
      let reply = function (response) {
        assert.deepEqual(response, expectedResponse)
        return {
          code: function (statusCode) {
            assert.equal(statusCode, 200)
            assert.end()
          }
        }
      }
      Handler.perform('', reply)
    })
    prepareTest.end()
  })

  handlerTest.end()
})
