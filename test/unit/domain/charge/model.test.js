'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Model = require(`${src}/domain/charge/model`)
const Db = require(`${src}/db`)

Test('charges model', modelTest => {
  let sandbox
  let dbConnection
  let dbMethodsStub

  const chargesTable = 'charges'

  let setupDatabase = (methodStubs = dbMethodsStub) => {
    dbConnection.withArgs(chargesTable).returns(methodStubs)
  }

  modelTest.beforeEach((t) => {
    sandbox = Sinon.sandbox.create()
    dbMethodsStub = {
      insert: sandbox.stub(),
      where: sandbox.stub(),
      orderBy: sandbox.stub()
    }
    sandbox.stub(Db, 'connect')
    dbConnection = sandbox.stub()
    Db.connect.returns(P.resolve(dbConnection))
    t.end()
  })

  modelTest.afterEach((t) => {
    sandbox.restore()
    t.end()
  })

  modelTest.test('getAll should', getAllTest => {
    getAllTest.test('return exception if db.connect throws', test => {
      const error = new Error()
      Db.connect.returns(P.reject(error))

      Model.getAll()
        .then(() => {
          test.fail('Should have thrown error')
        })
        .catch(err => {
          test.equal(err, error)
          test.end()
        })
    })

    getAllTest.test('return exception if db query throws', test => {
      const error = new Error()

      dbMethodsStub.orderBy.withArgs('name', 'asc').returns(P.reject(error))
      setupDatabase()

      Model.getAll()
        .then(() => {
          test.fail('Should have thrown error')
        })
        .catch(err => {
          test.equal(err, error)
          test.end()
        })
    })

    getAllTest.test('return all charges ordered by name', test => {
      const charge1Name = 'charge1'
      const charge2Name = 'charge2'
      const charges = [{ name: charge1Name }, { name: charge2Name }]

      dbMethodsStub.orderBy.withArgs('name', 'asc').returns(P.resolve(charges))
      setupDatabase()

      Model.getAll()
        .then((found) => {
          test.equal(found, charges)
          test.end()
        })
        .catch(err => {
          test.fail(err)
        })
    })

    getAllTest.end()
  })

  modelTest.test('getAllSenderAsPayer should', getAllSenderAsPayerTest => {
    getAllSenderAsPayerTest.test('return exception if db.connect throws', test => {
      const error = new Error()
      Db.connect.returns(P.reject(error))

      Model.getAllSenderAsPayer()
        .then(() => {
          test.fail('Should have thrown error')
        })
        .catch(err => {
          test.equal(err, error)
          test.end()
        })
    })

    getAllSenderAsPayerTest.test('return exception if db query throws', test => {
      const error = new Error()

      let orderByStub = sandbox.stub().returns(P.reject(error))
      dbMethodsStub.where.withArgs({ payer: 'sender' }).returns({ orderBy: orderByStub })
      setupDatabase()

      Model.getAllSenderAsPayer()
        .then(() => {
          test.fail('Should have thrown error')
        })
        .catch(err => {
          test.ok(orderByStub.withArgs('name', 'asc').calledOnce)
          test.equal(err, error)
          test.end()
        })
    })

    getAllSenderAsPayerTest.test('return all charges ordered by name', test => {
      const charges = [{ name: 'charge1' }, { name: 'charge2' }, { name: 'charge3' }]

      let orderByStub = sandbox.stub().returns(P.resolve(charges))
      dbMethodsStub.where.withArgs({ payer: 'sender' }).returns({ orderBy: orderByStub })
      setupDatabase()

      Model.getAllSenderAsPayer()
        .then((found) => {
          test.ok(orderByStub.withArgs('name', 'asc').calledOnce)
          test.equal(found, charges)
          test.end()
        })
        .catch(err => {
          test.fail(err)
        })
    })

    getAllSenderAsPayerTest.end()
  })

  modelTest.test('create should', createTest => {
    createTest.test('save payload and return new charge', test => {
      let name = 'charge'
      let charge = { name }

      dbMethodsStub.insert.returns(P.resolve([charge]))
      setupDatabase()

      const payload = { name }

      Model.create(payload)
        .then(created => {
          const insertArg = dbMethodsStub.insert.firstCall.args[0]
          test.notEqual(insertArg, payload)
          test.equal(created, charge)
          test.end()
        })
    })

    createTest.end()
  })

  modelTest.end()
})

