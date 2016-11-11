'use strict'

const src = '../../../../src'
const Sinon = require('sinon')
const Test = require('tapes')(require('tape'))
const P = require('bluebird')
const Handler = require(`${src}/api/positions/handler`)
const PositionService = require(`${src}/services/position`)

Test('positions handler', (handlerTest) => {
  let sandbox
  let hostname = 'http://some-host'

  handlerTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(PositionService, 'calculateForAllAccounts')
    t.end()
  })

  handlerTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  handlerTest.test('perform should', (performTest) => {
    performTest.test('return no positions if there are no settleable transfers', (assert) => {
      PositionService.calculateForAllAccounts.returns(P.resolve([]))

      let expectedResponse = { positions: [] }
      let reply = function (response) {
        assert.ok(PositionService.calculateForAllAccounts.calledOnce)
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

    performTest.test('return expected positions if settleable transfers exist', (assert) => {
      let positions = [
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
      ]

      PositionService.calculateForAllAccounts.returns(P.resolve(positions))

      let expectedResponse = { positions: positions }

      let reply = function (response) {
        assert.ok(PositionService.calculateForAllAccounts.calledOnce)
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
    performTest.end()
  })

  handlerTest.end()
})
