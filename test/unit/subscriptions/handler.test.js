'use strict'

const Sinon = require('sinon')
const Test = require('tape')
const Uuid = require('uuid4')
const Base = require('../base')

Test('create and return subscription', function (assert) {
  let payload = { url: 'http://test.com', secret: 'my-secret' }
  let inserted = { subscription_uuid: Uuid(), url: payload.url, created_date: new Date().toISOString() }

  let fixtures = Base.setup()

  let mockSave = setupMockSave(fixtures, function (obj, cb) {
    cb(null, inserted)
  })

  let req = Base.buildRequest('/subscriptions', 'POST', payload)

  fixtures.server.inject(req, function (res) {
    assert.equal(res.statusCode, 201)
    assert.equal(res.result.id, inserted.subscription_uuid)
    assert.equal(res.result.url, inserted.url)
    assert.equal(res.result.created, inserted.created_date)
    assert.ok(mockSave.calledOnce)
    assert.ok(mockSave.calledWith(Sinon.match(payload)))
    assert.end()
  })
})

Test('return error if database error saving subscription', function (assert) {
  let payload = { url: 'http://test.com', secret: 'my-secret' }
  let fixtures = Base.setup()

  let mockSave = setupMockSave(fixtures, function (obj, cb) {
    cb(new Error('Error connecting to database.'), null)
  })

  let req = Base.buildRequest('/subscriptions', 'POST', payload)

  fixtures.server.inject(req, function (res) {
    Base.assertServerError(assert, res)
    assert.ok(mockSave.calledOnce)
    assert.ok(mockSave.calledWith(Sinon.match(payload)))
    assert.end()
  })
})

Test('return error if required field missing', function (assert) {
  let fixtures = Base.setup()
  let req = Base.buildRequest('/subscriptions', 'POST', { url: 'http://test.com' })

  let mockSave = setupMockSave(fixtures, function (obj, cb) {
    cb(new Error('Test should not get here.'), null)
  })

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res)
    assert.ok(res.result.message.includes('secret'))
    assert.equal(mockSave.callCount, 0)
    assert.end()
  })
})

Test('return error if invalid url', function (assert) {
  let fixtures = Base.setup()
  let req = Base.buildRequest('/subscriptions', 'POST', { url: 'test.com' })

  let mockSave = setupMockSave(fixtures, function (obj, cb) {
    cb(new Error('Test should not get here.'), null)
  })

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res)
    assert.ok(res.result.message.includes('url'))
    assert.equal(mockSave.callCount, 0)
    assert.end()
  })
})

Test('get subscription by id', function (assert) {
  let record = { subscription_uuid: Uuid(), url: 'http://test.com', created_date: new Date().toISOString() }

  let fixtures = Base.setup()

  let mockFindOne = setupMockFindOne(fixtures, function (obj, cb) {
    cb(null, record)
  })

  let req = Base.buildRequest('/subscriptions/' + record.subscription_uuid, 'GET')

  fixtures.server.inject(req, function (res) {
    assert.equal(res.statusCode, 200)
    assert.equal(res.result.id, record.subscription_uuid)
    assert.equal(res.result.url, record.url)
    assert.equal(res.result.created, record.created_date)
    assert.ok(mockFindOne.calledOnce)
    assert.ok(mockFindOne.calledWith({ subscription_uuid: record.subscription_uuid, deleted: 0 }))
    assert.end()
  })
})

Test('return error if subscription not found by id', function (assert) {
  let fixtures = Base.setup()

  let mockFindOne = setupMockFindOne(fixtures, function (obj, cb) {
    cb(new Error('Test should not get here.'), null)
  })

  let req = Base.buildRequest('/subscriptions/abcd', 'GET')

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res)
    assert.ok(res.result.message.includes('id'))
    assert.equal(mockFindOne.callCount, 0)
    assert.end()
  })
})

Test('return error if subscription not found by id', function (assert) {
  let fixtures = Base.setup()

  let mockFindOne = setupMockFindOne(fixtures, function (obj, cb) {
    cb(null, null)
  })

  let subscriptionUuid = Uuid()
  let req = Base.buildRequest('/subscriptions/' + subscriptionUuid, 'GET')

  fixtures.server.inject(req, function (res) {
    Base.assertNotFoundError(assert, res)
    assert.ok(mockFindOne.calledOnce)
    assert.ok(mockFindOne.calledWith({ subscription_uuid: subscriptionUuid, deleted: 0 }))
    assert.end()
  })
})

Test('return error if database error retrieving subscription', function (assert) {
  let fixtures = Base.setup()

  let mockFindOne = setupMockFindOne(fixtures, function (obj, cb) {
    cb(new Error('Error connecting to database.'), null)
  })

  let subscriptionUuid = Uuid()
  let req = Base.buildRequest('/subscriptions/' + subscriptionUuid, 'GET')

  fixtures.server.inject(req, function (res) {
    Base.assertServerError(assert, res)
    assert.ok(mockFindOne.calledOnce)
    assert.ok(mockFindOne.calledWith({ subscription_uuid: subscriptionUuid, deleted: 0 }))
    assert.end()
  })
})

function setupMockSave (fixtures, saveFunction) {
  let mockSubscriptions = Sinon.mock({})
  let mockSave = Sinon.spy(saveFunction)

  mockSubscriptions.save = mockSave
  fixtures.server.app.db.subscriptions = mockSubscriptions

  return mockSave
}

function setupMockFindOne (fixtures, findOneFunction) {
  let mockSubscriptions = Sinon.mock({})
  let mockFindOne = Sinon.spy(findOneFunction)

  mockSubscriptions.findOne = mockFindOne
  fixtures.server.app.db.subscriptions = mockSubscriptions

  return mockFindOne
}
