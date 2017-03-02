'use strict'

const src = '../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Uuid = require('uuid4')
const Model = require(`${src}/models/settlements`)
const Db = require(`${src}/db`)
const Proxyquire = require('proxyquire')

Test('settlements model', function (modelTest) {
  let sandbox
  let settlementsStubs

  const settlementsTable = 'settlements'

  modelTest.beforeEach((t) => {
    sandbox = Sinon.sandbox.create()

    settlementsStubs = {
      insert: sandbox.stub()
    }

    Db.connection = sandbox.stub()
    Db.connection.withArgs(settlementsTable).returns(settlementsStubs)

    t.end()
  })

  modelTest.afterEach((t) => {
    sandbox.restore()
    t.end()
  })

  modelTest.test('create should', createTest => {
    createTest.test('insert and return new settlement record', test => {
      let settlementId = Uuid()
      let settlement = { settlementId: settlementId }

      settlementsStubs.insert.withArgs({ settlementId: settlementId }, '*').returns(P.resolve([settlement]))

      Model.create(settlementId)
        .then(c => {
          test.equal(c, settlement)
          test.end()
        })
    })

    createTest.end()
  })

  modelTest.test('generateId should', generateIdTest => {
    generateIdTest.test('return Uuid', test => {
      let expectedUuid = Uuid()
      let model = Proxyquire(`${src}/models/settlements`, { 'uuid4': () => expectedUuid })

      test.equals(expectedUuid, model.generateId())
      test.end()
    })

    generateIdTest.end()
  })

  modelTest.end()
})
