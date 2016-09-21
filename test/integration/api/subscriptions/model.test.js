'use strict'

const Test = require('tape')
const Model = require('../../../../src/api/subscriptions/model')

Test('subscription model', function (modelTest) {
  modelTest.test('create should', function (createTest) {
    createTest.test('create a new subscription', function (assert) {
      let payload = { url: 'http://test.com', secret: 'my-secret' }
      createSubscription(payload)
        .then((subscription) => {
          assert.ok(subscription.subscriptionId)
          assert.ok(subscription.subscriptionUuid)
          assert.equal(subscription.url, payload.url)
          assert.equal(subscription.secret, payload.secret)
          assert.equal(subscription.deleted, 0)
          assert.ok(subscription.createdDate)
          assert.end()
        })
    })

    createTest.end()
  })

  modelTest.test('getByIdShould', function (getByIdTest) {
    getByIdTest.test('finds undeleted subscription by subscriptionUuid', function (assert) {
      let payload = { url: 'http://test2.com', secret: 'my-new-secret' }
      createSubscription(payload)
        .then((subscription) => {
          Model.getById(subscription.subscriptionUuid)
            .then((found) => {
              assert.notEqual(found, subscription)
              assert.equal(found.subscriptionId, subscription.subscriptionId)
              assert.equal(found.subscriptionUuid, subscription.subscriptionUuid)
              assert.equal(found.url, subscription.url)
              assert.equal(found.secret, subscription.secret)
              assert.equal(found.deleted, subscription.deleted)
              assert.deepEqual(found.createdDate, subscription.createdDate)
              assert.end()
            })
        })
    })

    getByIdTest.end()
  })

  modelTest.end()
})

function createSubscription (payload) {
  return Model.create(payload)
}
