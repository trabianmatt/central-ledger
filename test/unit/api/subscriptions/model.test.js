'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const P = require('bluebird')
const Sinon = require('sinon')
const Uuid = require('uuid4')
const Model = require(`${src}/api/subscriptions/model`)
const Db = require(`${src}/lib/db`)

function setupSubscriptionsDb (subscriptions) {
  let db = { subscriptions: subscriptions }
  Db.connect.returns(P.resolve(db))
}

Test('subscription model', function (modelTest) {
  let sandbox

  modelTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Db, 'connect')
    t.end()
  })

  modelTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  modelTest.test('getByIdShould', function (getByIdTest) {
    getByIdTest.test('return exception if db.connect throws', function (t) {
      let error = new Error()
      Db.connect.returns(P.reject(error))

      Model.getById(1)
        .then(() => {
          t.fail('Should have thrown error')
          t.end()
        })
        .catch(err => {
          t.equal(err, error)
          t.end()
        })
    })

    getByIdTest.test('return exception if db.findOneAsync throws', function (t) {
      let error = new Error()
      let findOneAsync = function () { return P.reject(error) }
      setupSubscriptionsDb({ findOneAsync: findOneAsync })

      Model.getById(1)
        .then(() => {
          t.fail('Should have thrown error')
          t.end()
        })
        .catch(err => {
          t.equal(err, error)
          t.end()
        })
    })

    getByIdTest.test('finds undeleted subscription by subscriptionUuid', function (t) {
      let id = Uuid()
      let subscription = { id: id }
      let findOneAsync = sandbox.stub().returns(P.resolve(subscription))
      setupSubscriptionsDb({ findOneAsync: findOneAsync })

      Model.getById(id)
        .then(d => {
          let findOneAsyncArg = findOneAsync.firstCall.args[0]
          t.equal(d, subscription)
          t.equal(findOneAsyncArg.subscriptionUuid, id)
          t.equal(findOneAsyncArg.deleted, 0)
          t.end()
        })
        .catch(err => {
          t.fail(err)
          t.end()
        })
    })

    getByIdTest.end()
  })

  modelTest.test('create should', function (createTest) {
    createTest.test('save payload as new object', function (t) {
      let saveAsync = sandbox.stub()
      setupSubscriptionsDb({ saveAsync: saveAsync })
      let payload = { url: 'http://test.com', secret: 'my-secret' }

      Model.create(payload)
        .then(() => {
          let saveAsyncArg = saveAsync.firstCall.args[0]
          t.ok(saveAsyncArg.subscriptionUuid)
          t.notEqual(saveAsyncArg, payload)
          t.equal(saveAsyncArg.url, payload.url)
          t.equal(saveAsyncArg.secret, payload.secret)
          t.end()
        })
    })

    createTest.test('return newly created subscription', function (t) {
      let newSubscription = { subscriptionUuid: Uuid() }
      let saveAsync = sandbox.stub().returns(newSubscription)
      setupSubscriptionsDb({ saveAsync: saveAsync })

      Model.create({})
        .then(s => {
          t.equal(s, newSubscription)
          t.end()
        })
        .catch(err => {
          t.fail(err)
          t.end()
        })
    })

    createTest.end()
  })

  modelTest.end()
})
