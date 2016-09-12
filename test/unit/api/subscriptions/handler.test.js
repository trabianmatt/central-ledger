'use strict'

const Proxyquire = require('proxyquire')
const Sinon = require('sinon')
const Test = require('tape')
const Boom = require('boom')
const P = require('bluebird')

function createHandler (model) {
  return Proxyquire('../../../../src/api/subscriptions/handler', {
    './model': model
  })
}

function createRequest (id, payload) {
  let requestId = id || 12
  let requestPayload = payload || {}
  return {
    payload: requestPayload,
    params: { id: requestId },
    server: {
      log: function () { }
    }
  }
}

Test('subscription handler', function (handlerTest) {
  handlerTest.test('getSubscriptionById should', function (getSubscriptionByIdTest) {
    getSubscriptionByIdTest.test('get subscription by request id', function (t) {
      let id = 12
      let subscription = { subscriptionUuid: 'test', url: 'test', secret: 'test', createdDate: new Date() }
      let model = {
        getById: Sinon.stub().returns(P.resolve(subscription))
      }
      let reply = function (response) {
        t.equal(response.id, subscription.subscriptionUuid)
        t.equal(response.url, subscription.url)
        t.equal(response.created, subscription.createdDate)
        return {
          code: function (statusCode) {
            t.equal(statusCode, 200)
            t.end()
          }
        }
      }
      createHandler(model).getSubscriptionById(createRequest(id), reply)
    })

    getSubscriptionByIdTest.test('return 404 if subscription null', function (t) {
      let model = {
        getById: Sinon.stub().returns(P.resolve(null))
      }
      let reply = function (response) {
        t.deepEqual(response, Boom.notFound())
        t.end()
      }

      createHandler(model).getSubscriptionById(createRequest(), reply)
    })

    getSubscriptionByIdTest.test('return error if model throws error', function (t) {
      let error = new Error()
      let model = {
        getById: function () { return P.reject(error) }
      }

      let reply = function (response) {
        t.deepEqual(response, Boom.wrap(error))
        t.end()
      }

      createHandler(model).getSubscriptionById(createRequest(), reply)
    })

    getSubscriptionByIdTest.end()
  })

  handlerTest.test('createSubscription should', function (createSubscriptionTest) {
    createSubscriptionTest.test('return created subscription', function (t) {
      let payload = { url: 'url', secret: 'secret' }
      let subscription = { subscriptionUuid: 'test', url: 'test', secret: 'test', createdDate: new Date() }
      let model = {
        create: Sinon.stub().withArgs(payload).returns(P.resolve(subscription))
      }

      let reply = function (response) {
        t.equal(response.id, subscription.subscriptionUuid)
        t.equal(response.url, subscription.url)
        t.equal(response.created, subscription.createdDate)
        return {
          code: function (statusCode) {
            t.equal(statusCode, 201)
            t.end()
          }
        }
      }

      createHandler(model).createSubscription(createRequest(12, payload), reply)
    })

    createSubscriptionTest.test('return error if model throws error', function (t) {
      let error = new Error()
      let model = {
        create: function () { return P.reject(error) }
      }

      let reply = function (response) {
        t.deepEqual(response, Boom.wrap(error))
        t.end()
      }

      createHandler(model).createSubscription(createRequest(), reply)
    })

    createSubscriptionTest.end()
  })
  handlerTest.end()
})
