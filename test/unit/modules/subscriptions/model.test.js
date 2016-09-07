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
  let db = { subscriptions: subscriptions }
  return {
    connect: Promise.resolve(db)
  }
}

Test('subscription model', function (modelTest) {
  modelTest.test('getByIdShould', function (getByIdTest) {
    getByIdTest.test('return exception if db.connect throws', function (t) {
      let error = new Error()
      let db = { connect: Promise.reject(error) }
      let model = createModel(db)

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
      let error = new Error()
      let findOneAsync = function () { return Promise.reject(error) }
      let db = setupSubscriptionsDb({ findOneAsync: findOneAsync })
      let model = createModel(db)

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
      let id = Uuid()
      let subscription = { id: id }
      let findOneAsync = Sinon.stub().returns(Promise.resolve(subscription))
      let model = createModel(setupSubscriptionsDb({ findOneAsync: findOneAsync }))

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
      let saveAsync = Sinon.stub()
      let model = createModel(setupSubscriptionsDb({ saveAsync: saveAsync }))
      let payload = { url: 'http://test.com', secret: 'my-secret' }
      model.create(payload)
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
      let saveAsync = Sinon.stub().returns(newSubscription)
      let model = createModel(setupSubscriptionsDb({ saveAsync: saveAsync }))
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
