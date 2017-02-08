'use strict'

const src = '../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Uuid = require('uuid4')
const PostgresStore = require(`${src}/eventric/postgres-store`).default
const Db = require(`${src}/db`)

Test('postgres store test', storeTest => {
  let sandbox
  let dbConnection
  let tableStub

  let createDomainEvent = (payload = {}) => {
    return {
      name: 'test',
      payload: payload,
      aggregate: {
        id: Uuid(),
        name: 'TestAggregate'
      },
      timestamp: new Date(),
      ensureIsFirstDomainEvent: true
    }
  }

  let createEvent = () => {
    return {
      sequenceNumber: 1,
      name: 'SomeEventName',
      payload: {},
      aggregateId: Uuid(),
      aggregateName: 'TestAggregate',
      timestamp: new Date().toISOString()
    }
  }

  let createStore = (contextName = 'SomeName') => {
    let store = new PostgresStore()
    return P.resolve(store.initialize({ name: contextName }))
      .then(ctx => {
        dbConnection[ctx._tableName] = tableStub
        return ctx
      })
  }

  let setSequenceNumber = (sequenceNumber = 0) => {
    dbConnection.runAsync.withArgs(Sinon.match('SELECT MAX("sequenceNumber")'))
      .returns(P.resolve([{ max: sequenceNumber }]))
  }

  storeTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    tableStub = {
      insertAsync: sandbox.stub(),
      find: sandbox.stub(),
      findAsync: sandbox.stub()
    }
    sandbox.stub(Db, 'connect')
    dbConnection = sandbox.stub()
    dbConnection.runAsync = sandbox.stub()
    Db.connect.returns(P.resolve(dbConnection))
    sandbox.stub()
    t.end()
  })

  storeTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  storeTest.test('initialize should', initializeTest => {
    initializeTest.test('set table name and context', test => {
      let context = {
        name: 'SomeName'
      }

      let postgresStore = new PostgresStore()

      postgresStore.initialize(context)
        .then(store => {
          test.equal(store._tableName, 'someNameDomainEvents')
          test.equal(store._context, context)
          test.end()
        })
    })
    initializeTest.end()
  })

  storeTest.test('_getNextSequenceNumber should', seqTest => {
    seqTest.test('return 1 if domainEvent is firstDomainEvent', test => {
      setSequenceNumber(-12)
      let domainEvent = createDomainEvent()
      createStore().then(store => store._getNextSequenceNumber(dbConnection, domainEvent))
      .then(result => {
        test.equal(result, 1)
        test.end()
      })
    })

    seqTest.test('return 1 if no records exist for aggregate', test => {
      dbConnection.runAsync.returns(P.resolve([{ max: null }]))
      let domainEvent = createDomainEvent()
      domainEvent.ensureIsFirstDomainEvent = false
      createStore().then(s => s._getNextSequenceNumber(dbConnection, domainEvent))
      .then(result => {
        test.equal(result, 1)
        test.end()
      })
    })

    seqTest.test('return max + 1 if max sequenceNumber found', test => {
      let maxSequenceNumber = 100
      dbConnection.runAsync.returns(P.resolve([{ max: maxSequenceNumber }]))
      let domainEvent = createDomainEvent()
      domainEvent.ensureIsFirstDomainEvent = false
      createStore().then(s => s._getNextSequenceNumber(dbConnection, domainEvent))
      .then(result => {
        test.equal(result, maxSequenceNumber + 1)
        test.end()
      })
    })
    seqTest.end()
  })

  storeTest.test('saveDomainEvent should', saveDomainEventTest => {
    saveDomainEventTest.test('insert event in db', test => {
      let domainEvent = createDomainEvent()
      let insertAsyncCalled = false
      let insertArg
      tableStub.insertAsync = a => {
        insertArg = a
        insertAsyncCalled = true
        return P.resolve(a)
      }
      setSequenceNumber(0)
      createStore()
        .then(s => {
          s.saveDomainEvent(domainEvent)
            .then(result => {
              test.ok(insertAsyncCalled)
              test.ok(insertArg.eventId)
              test.equal(insertArg.name, domainEvent.name)
              test.equal(insertArg.payload, domainEvent.payload)
              test.equal(insertArg.aggregateId, domainEvent.aggregate.id)
              test.equal(insertArg.aggregateName, domainEvent.aggregate.name)
              test.equal(insertArg.sequenceNumber, 1)
              test.equal(insertArg.timestamp, domainEvent.timestamp.toISOString())

              test.equal(result.id, 1)
              test.equal(result.name, domainEvent.name)
              test.equal(result.payload, domainEvent.payload)
              test.deepEqual(result.aggregate, domainEvent.aggregate)
              test.equal(result.context, 'SomeName')
              test.equal(result.timestamp, domainEvent.timestamp.getTime())
              test.end()
            })
        })
    })

    saveDomainEventTest.test('throw error if error not duplicate key error', test => {
      let error = new Error('not duplicate key error')
      tableStub.insertAsync.returns(P.reject(error))
      setSequenceNumber(0)
      createStore()
        .then(store => store.saveDomainEvent(createDomainEvent()))
        .then(() => {
          test.fail('Expected exception to be thrown')
          test.end()
        })
        .catch(e => {
          test.equal(e, error)
          test.end()
        })
    })

    saveDomainEventTest.end()
  })

  storeTest.test('findDomainEventsByName should', findTest => {
    findTest.test('find events by name', test => {
      let domainEventNames = ['name1', 'name2']
      let results = [createEvent(), createEvent()]
      tableStub.findAsync.withArgs(Sinon.match({ name: domainEventNames })).returns(P.resolve(results))

      createStore()
      .then(s => {
        let cb = (err, result) => {
          test.notOk(err)
          test.deepEqual(result, results.map(x => s._toDomainEvent(x)))
          test.end()
        }
        s.findDomainEventsByName(domainEventNames, cb)
      })
    })

    findTest.test('convert name to array', test => {
      let domainEventName = 'name1'
      let results = [createEvent(), createEvent()]
      tableStub.findAsync.withArgs(Sinon.match({ name: [domainEventName] })).returns(P.resolve(results))
      createStore()
      .then(s => {
        let cb = (err, result) => {
          test.notOk(err)
          test.deepEqual(result, results.map(x => s._toDomainEvent(x)))
          test.end()
        }
        s.findDomainEventsByName(domainEventName, cb)
      })
    })

    findTest.test('return error if db.find throws error', test => {
      let error = new Error()
      tableStub.findAsync.returns(P.reject(error))
      let cb = (err, result) => {
        test.equal(err, error)
        test.notOk(result)
        test.end()
      }

      createStore().then(s => s.findDomainEventsByName('somename', cb))
    })

    findTest.test('return error if db.connect throws error', test => {
      let error = new Error()
      Db.connect.returns(P.reject(error))

      let cb = (err, result) => {
        test.equal(err, error)
        test.notOk(result)
        test.end()
      }

      createStore().then(s => s.findDomainEventsByName('somename', cb))
    })

    findTest.end()
  })

  storeTest.test('findDomainEventsByAggregateId should', findTest => {
    findTest.test('find events by aggregateId', test => {
      let ids = [Uuid(), Uuid()]
      let results = [createEvent(), createEvent()]
      tableStub.findAsync.withArgs(Sinon.match({ aggregateId: ids })).returns(P.resolve(results))

      createStore()
      .then(s => {
        let cb = (err, result) => {
          test.notOk(err)
          test.deepEqual(result, results.map(x => s._toDomainEvent(x)))
          test.end()
        }
        s.findDomainEventsByAggregateId(ids, cb)
      })
    })

    findTest.test('convert id to array', test => {
      let id = Uuid()
      let results = [createEvent(), createEvent()]
      tableStub.findAsync.withArgs(Sinon.match({ aggregateId: [id] })).returns(P.resolve(results))
      createStore()
      .then(s => {
        let cb = (err, result) => {
          test.notOk(err)
          test.deepEqual(result, results.map(x => s._toDomainEvent(x)))
          test.end()
        }
        s.findDomainEventsByAggregateId(id, cb)
      })
    })

    findTest.test('return error if db.find throws error', test => {
      let error = new Error()
      tableStub.findAsync.returns(P.reject(error))
      let cb = (err, result) => {
        test.equal(err, error)
        test.notOk(result)
        test.end()
      }

      createStore().then(s => s.findDomainEventsByAggregateId(Uuid(), cb))
    })

    findTest.test('return error if db.connect throws error', test => {
      let error = new Error()
      Db.connect.returns(P.reject(error))

      let cb = (err, result) => {
        test.equal(err, error)
        test.notOk(result)
        test.end()
      }

      createStore().then(s => s.findDomainEventsByAggregateId(Uuid(), cb))
    })

    findTest.end()
  })

  storeTest.test('findDomainEventsByNameAndAggregateId should', findTest => {
    findTest.test('find events by name and aggregateId', test => {
      let domainEventNames = ['name1', 'name2']
      let ids = [Uuid(), Uuid()]
      let results = [createEvent(), createEvent()]
      tableStub.findAsync.withArgs(Sinon.match({ name: domainEventNames, aggregateId: ids })).returns(P.resolve(results))

      createStore()
      .then(s => {
        let cb = (err, result) => {
          test.notOk(err)
          test.deepEqual(result, results.map(x => s._toDomainEvent(x)))
          test.end()
        }
        s.findDomainEventsByNameAndAggregateId(domainEventNames, ids, cb)
      })
    })

    findTest.test('convert name and id to array', test => {
      let name = 'name1'
      let id = Uuid()
      let results = [createEvent(), createEvent()]
      tableStub.findAsync.withArgs(Sinon.match({ name: [name], aggregateId: [id] })).returns(P.resolve(results))
      createStore()
      .then(s => {
        let cb = (err, result) => {
          test.notOk(err)
          test.deepEqual(result, results.map(x => s._toDomainEvent(x)))
          test.end()
        }
        s.findDomainEventsByNameAndAggregateId(name, id, cb)
      })
    })

    findTest.test('return error if db.find throws error', test => {
      let error = new Error()
      tableStub.findAsync.returns(P.reject(error))
      let cb = (err, result) => {
        test.equal(err, error)
        test.notOk(result)
        test.end()
      }

      createStore().then(s => s.findDomainEventsByNameAndAggregateId('name', Uuid(), cb))
    })

    findTest.test('return error if db.connect throws error', test => {
      let error = new Error()
      Db.connect.returns(P.reject(error))

      let cb = (err, result) => {
        test.equal(err, error)
        test.notOk(result)
        test.end()
      }

      createStore().then(s => s.findDomainEventsByNameAndAggregateId('name', Uuid(), cb))
    })

    findTest.end()
  })

  storeTest.test('destroy should', destroyTest => {
    destroyTest.test('do nothing', test => {
      createStore()
      .then(s => {
        s.destroy()
        test.pass()
        test.end()
      })
    })
    destroyTest.end()
  })
  storeTest.end()
})
