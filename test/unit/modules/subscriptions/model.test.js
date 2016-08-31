'use strict'

const Test = require('tape')
const Proxyquire = require('proxyquire')
const Sinon = require('sinon')
const Uuid = require('uuid4')

function createModel (db) {
  return Proxyquire('../../../../src/modules/subscriptions/model', {
    '../../lib/db': db
  })
}

function setupSubscriptionsDb (subscriptions) {
  var db = { subscriptions: subscriptions }
  return {
    connect: Promise.resolve(db)
  }
}

Test('subscription model', function (modelTest) {
  modelTest.test('getByIdShould', function (getByIdTest) {
    getByIdTest.test('return exception if db.connect throws', function (t) {
      var error = new Error()
      var db = { connect: Promise.reject(error) }
      var model = createModel(db)

      model.getById(1)
        .then(() => {
          t.fail('Should have thrown error')
        })
        .catch(err => {
          t.equal(err, error)
          t.end()
        })
    })

    getByIdTest.test('return exception if db.findOneAsync throws', function (t) {
      var error = new Error()
      var findOneAsync = function () { return Promise.reject(error) }
      var db = setupSubscriptionsDb({ findOneAsync: findOneAsync })
      var model = createModel(db)

      model.getById(1)
        .then(() => {
          t.fail('Should have thrown error')
        })
        .catch(err => {
          t.equal(err, error)
          t.end()
        })
    })

    getByIdTest.test('finds undeleted subscription by subscriptionUuid', function (t) {
      var id = Uuid()
      var subscription = { id: id }
      var findOneAsync = Sinon.stub().returns(Promise.resolve(subscription))
      var model = createModel(setupSubscriptionsDb({ findOneAsync: findOneAsync }))

      model.getById(id)
        .then(d => {
          t.equal(d, subscription)
          t.equal(findOneAsync.firstCall.args[0].subscriptionUuid, id)
          t.equal(findOneAsync.firstCall.args[0].deleted, 0)
          t.end()
        })
        .catch(err => {
          t.fail(err)
        })
    })

    getByIdTest.end()
  })

  modelTest.test('create should', function (createTest) {
    createTest.test('save payload as new object', function (t) {
      var saveAsync = Sinon.stub()
      var model = createModel(setupSubscriptionsDb({ saveAsync: saveAsync }))
      var payload = { url: 'http://test.com', secret: 'my-secret' }
      model.create(payload)
        .then(() => {
          var saveAsyncArg = saveAsync.firstCall.args[0]
          t.ok(saveAsyncArg.subscriptionUuid)
          t.notEqual(saveAsyncArg, payload)
          t.equal(saveAsyncArg.url, payload.url)
          t.equal(saveAsyncArg.secret, payload.secret)
          t.end()
        })
    })

    createTest.test('return newly created subscription', function (t) {
      var newSubscription = { subscriptionUuid: Uuid() }
      var saveAsync = Sinon.stub().returns(newSubscription)
      var model = createModel(setupSubscriptionsDb({ saveAsync: saveAsync }))
      model.create({})
        .then(s => {
          t.equal(s, newSubscription)
          t.end()
        })
        .catch(err => {
          t.fail(err)
        })
    })

    createTest.end()
  })

  modelTest.end()
})
