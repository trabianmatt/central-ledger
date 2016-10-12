'use strict'

const src = '../../../../src'
const Sinon = require('sinon')
const Test = require('tapes')(require('tape'))
const Boom = require('boom')
const P = require('bluebird')
const Handler = require(`${src}/api/subscriptions/handler`)
const Model = require(`${src}/api/subscriptions/model`)

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
  let sandbox

  handlerTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Model, 'getById')
    sandbox.stub(Model, 'create')
    t.end()
  })

  handlerTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  handlerTest.test('getSubscriptionById should', function (getSubscriptionByIdTest) {
    getSubscriptionByIdTest.test('get subscription by request id', function (t) {
      let id = 12
      let subscription = { subscriptionUuid: 'test', url: 'test', secret: 'test', createdDate: new Date() }
      Model.getById.returns(P.resolve(subscription))

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
      Handler.getSubscriptionById(createRequest(id), reply)
    })

    getSubscriptionByIdTest.test('return 404 if subscription null', function (t) {
      Model.getById.returns(P.resolve(null))

      let reply = function (response) {
        t.deepEqual(response, Boom.notFound())
        t.end()
      }

      Handler.getSubscriptionById(createRequest(), reply)
    })

    getSubscriptionByIdTest.test('return error if model throws error', function (t) {
      let error = new Error()
      Model.getById.returns(P.reject(error))

      let reply = function (response) {
        t.deepEqual(response, Boom.wrap(error))
        t.end()
      }

      Handler.getSubscriptionById(createRequest(), reply)
    })

    getSubscriptionByIdTest.end()
  })

  handlerTest.test('createSubscription should', function (createSubscriptionTest) {
    createSubscriptionTest.test('return created subscription', function (t) {
      let payload = { url: 'url', secret: 'secret' }
      let subscription = { subscriptionUuid: 'test', url: 'test', secret: 'test', createdDate: new Date() }
      Model.create.withArgs(payload).returns(P.resolve(subscription))

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

      Handler.createSubscription(createRequest(12, payload), reply)
    })

    createSubscriptionTest.test('return error if model throws error', function (t) {
      let error = new Error()
      Model.create.returns(P.reject(error))

      let reply = function (response) {
        t.deepEqual(response, Boom.wrap(error))
        t.end()
      }

      Handler.createSubscription(createRequest(), reply)
    })

    createSubscriptionTest.end()
  })
  handlerTest.end()
})
