'use strict'

const src = '../../../src'
const Test = require('tapes')(require('tape'))
const Uuid = require('uuid4')
const Sinon = require('sinon')
const Model = require(`${src}/models/settlements`)
const Db = require(`${src}/db`)
const Proxyquire = require('proxyquire')

Test('settlements model', function (modelTest) {
  let sandbox

  modelTest.beforeEach((t) => {
    sandbox = Sinon.sandbox.create()
    t.end()
  })

  modelTest.afterEach((t) => {
    sandbox.restore()
    t.end()
  })

  modelTest.test('create should', function (createTest) {
    createTest.test('invoke runAsync on db', function (assert) {
      let insertAsync = sandbox.stub().returns(Promise.resolve())
      let settlements = { insertAsync: insertAsync }
      sandbox.stub(Db, 'connect').returns(Promise.resolve({ settlements: settlements }))

      let settlementId = Uuid()

      Model.create(settlementId)
        .then(() => {
          assert.ok(insertAsync.calledWith({settlementId: settlementId}))
          assert.end()
        }
        )
    })

    createTest.end()
  })

  modelTest.test('generateId should', function (generateIdTest) {
    generateIdTest.test('return Uuid', function (assert) {
      let expectedUuid = Uuid()
      let model = Proxyquire(`${src}/models/settlements`, { 'uuid4': () => expectedUuid })

      assert.equals(expectedUuid, model.generateId())
      assert.end()
    })

    generateIdTest.end()
  })

  modelTest.end()
})
