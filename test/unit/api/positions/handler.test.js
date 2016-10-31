'use strict'

const src = '../../../../src'
const Sinon = require('sinon')
const Test = require('tapes')(require('tape'))
const P = require('bluebird')
const Config = require(`${src}/lib/config`)
const TransferService = require(`${src}/services/transfer`)
const Handler = require(`${src}/api/positions/handler`)

Test('positions handler', (handlerTest) => {
  let sandbox
  let originalHostName
  let hostname = 'http://some-host'

  handlerTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    originalHostName = Config.HOSTNAME
    Config.HOSTNAME = hostname
    t.end()
  })

  handlerTest.afterEach(t => {
    Config.HOSTNAME = originalHostName
    sandbox.restore()
    t.end()
  })

  handlerTest.test('prepare should', (prepareTest) => {
    prepareTest.test('return no positions if no executed transfers exist', (assert) => {
      sandbox.stub(TransferService, 'getExecuted').returns(P.resolve([]))

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
          debitAccountName: 'account1',
          debitAmount: '3',
          creditAccountName: 'account2',
          creditAmount: '3'
        },
        {
          debitAccountName: 'account1',
          debitAmount: '2',
          creditAccountName: 'account3',
          creditAmount: '2'
        }
      ]
      sandbox.stub(TransferService, 'getExecuted').returns(P.resolve(transfers))

      let expectedResponse = { positions: [
        {
          account: `${hostname}/accounts/account1`,
          payments: '5',
          receipts: '0',
          net: '-5'
        },
        {
          account: `${hostname}/accounts/account2`,
          payments: '0',
          receipts: '3',
          net: '3'
        },
        {
          account: `${hostname}/accounts/account3`,
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
