'use strict'

const Sinon = require('sinon')
const Test = require('tape')
const Uuid = require('uuid4')
const Base = require('../base')

Test('create and return subscription', function (assert) {
  let payload = { url: 'http://test.com', secret: 'my-secret' }
  let inserted = { subscriptionUuid: Uuid(), url: payload.url, createdDate: new Date().toISOString() }

  let fixtures = Base.setup()

  let mockSave = setupMockSave(fixtures, function (obj, cb) {
    cb(null, inserted)
  })

  let req = Base.buildRequest('/subscriptions', 'POST', payload)

  fixtures.server.inject(req, function (res) {
    assert.equal(res.statusCode, 201)
    assert.equal(res.result.id, inserted.subscriptionUuid)
    assert.equal(res.result.url, inserted.url)
    assert.equal(res.result.created, inserted.createdDate)
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
    Base.assertBadRequestError(assert, res, 'child "secret" fails because ["secret" is required]')
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
    Base.assertBadRequestError(assert, res, 'child "url" fails because ["url" must be a valid uri]')
    assert.equal(mockSave.callCount, 0)
    assert.end()
  })
})

Test('get subscription by id', function (assert) {
  let record = { subscriptionUuid: Uuid(), url: 'http://test.com', createdDate: new Date().toISOString() }

  let fixtures = Base.setup()

  let mockFindOne = setupMockFindOne(fixtures, function (obj, cb) {
    cb(null, record)
  })

  let req = Base.buildRequest('/subscriptions/' + record.subscriptionUuid, 'GET')

  fixtures.server.inject(req, function (res) {
    assert.equal(res.statusCode, 200)
    assert.equal(res.result.id, record.subscriptionUuid)
    assert.equal(res.result.url, record.url)
    assert.equal(res.result.created, record.createdDate)
    assert.ok(mockFindOne.calledOnce)
    assert.ok(mockFindOne.calledWith({ subscriptionUuid: record.subscriptionUuid, deleted: 0 }))
    assert.end()
  })
})

Test('return error if id is not a guid', function (assert) {
  let fixtures = Base.setup()

  let mockFindOne = setupMockFindOne(fixtures, function (obj, cb) {
    cb(new Error('Test should not get here.'), null)
  })

  let req = Base.buildRequest('/subscriptions/abcd', 'GET')

  fixtures.server.inject(req, function (res) {
    Base.assertBadRequestError(assert, res, 'child "id" fails because ["id" must be a valid GUID]')
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
    assert.ok(mockFindOne.calledWith({ subscriptionUuid: subscriptionUuid, deleted: 0 }))
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
    assert.ok(mockFindOne.calledWith({ subscriptionUuid: subscriptionUuid, deleted: 0 }))
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
