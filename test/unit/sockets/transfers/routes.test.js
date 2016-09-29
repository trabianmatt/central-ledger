'use strict'

const Tape = require('tape')
const Tapes = require('tapes')
const Test = Tapes(Tape)
const Sinon = require('sinon')
const Uuid = require('uuid4')
const Events = require('../../../../src/lib/events')
const UrlParser = require('../../../../src/lib/urlparser')
const Routes = require('../../../../src/sockets/transfers/routes')

function matchTransfer (transfer, transferId) {
  return function (t) {
    return t.resource.id === transferId &&
      t.resource.credits === transfer.resource.credits &&
      t.resource.debits === transfer.resource.debits
  }
}

Test('routes', function (routesTest) {
  let sandbox

  routesTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Events, 'onTransferPrepared')
    sandbox.stub(Events, 'onTransferExecuted')
    sandbox.stub(UrlParser, 'parseAccountName')
    sandbox.stub(UrlParser, 'toTransferUri')
    t.end()
  })

  routesTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  routesTest.test('setup server', function (serverTest) {
    let serverStub = {
      subscription: Sinon.spy()
    }

    Routes(serverStub)

    serverTest.ok(serverStub.subscription.calledOnce)
    serverTest.end()
  })

  routesTest.test('publish transfer prepared to transfer accounts', function (serverTest) {
    let serverStub = {
      subscription: Sinon.stub(),
      publish: Sinon.stub()
    }
    let account1 = 'account1'
    let account2 = 'account2'
    let id = Uuid()
    let idUri = 'some-transfer-id'

    let transfer = {
      resource: {
        id: id,
        credits: [
          {
            account: account1
          }
        ],
        debits: [
          {
            account: account2
          }
        ]
      }
    }

    UrlParser.parseAccountName.withArgs(account1).yields(null, account1)
    UrlParser.parseAccountName.withArgs(account2).yields(null, account2)
    UrlParser.toTransferUri.withArgs(id).returns(idUri)
    Events.onTransferPrepared.yields(transfer)

    Routes(serverStub)

    serverTest.ok(serverStub.publish.calledWith(`/accounts/${account1}/transfers`, Sinon.match(matchTransfer(transfer, idUri))))
    serverTest.ok(serverStub.publish.calledWith(`/accounts/${account2}/transfers`, Sinon.match(matchTransfer(transfer, idUri))))
    serverTest.end()
  })

  routesTest.test('publish transfer fulfilled to transfer accounts', function (serverTest) {
    let serverStub = {
      subscription: Sinon.stub(),
      publish: Sinon.stub()
    }
    let account1 = 'account1'
    let account2 = 'account2'
    let id = Uuid()
    let idUri = 'some-transfer-id'
    let transfer = {
      resource: {
        id: id,
        credits: [
          {
            account: account1
          }
        ],
        debits: [
          {
            account: account2
          }
        ]
      }
    }

    UrlParser.parseAccountName.withArgs(account1).yields(null, account1)
    UrlParser.parseAccountName.withArgs(account2).yields(null, account2)
    UrlParser.toTransferUri.withArgs(id).returns(idUri)
    Events.onTransferExecuted.yields(transfer)

    Routes(serverStub)
    serverTest.ok(serverStub.publish.calledWith(`/accounts/${account1}/transfers`, Sinon.match(matchTransfer(transfer, idUri))))
    serverTest.ok(serverStub.publish.calledWith(`/accounts/${account2}/transfers`, Sinon.match(matchTransfer(transfer, idUri))))
    serverTest.end()
  })

  routesTest.end()
})
