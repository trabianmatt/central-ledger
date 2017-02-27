'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Uuid = require('uuid4')
const Db = require('../../../../../src/db')
const RolesModel = require('../../../../../src/domain/security/models/roles')

Test('Roles model', modelTest => {
  let sandbox
  let dbConnection
  let dbMethodsStub

  let rolesTable = 'roles'

  let setupDatabase = (methodStubs = dbMethodsStub) => {
    dbConnection.withArgs(rolesTable).returns(methodStubs)
  }

  modelTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    dbMethodsStub = {
      insert: sandbox.stub(),
      where: sandbox.stub(),
      select: sandbox.stub()
    }
    sandbox.stub(Db, 'connect')
    dbConnection = sandbox.stub()
    Db.connect.returns(P.resolve(dbConnection))
    test.end()
  })

  modelTest.afterEach(test => {
    sandbox.restore()
    test.end()
  })

  modelTest.test('getAll should', getAllTest => {
    getAllTest.test('findAll roles in db', test => {
      const roles = [{ name: 'role1' }, { name: 'role2' }]

      dbMethodsStub.select.returns(P.resolve(roles))
      setupDatabase()

      RolesModel.getAll()
        .then(result => {
          test.deepEqual(result, roles)
          test.end()
        })
    })

    getAllTest.end()
  })

  modelTest.test('getById should', getByIdTest => {
    getByIdTest.test('find role by id in db', test => {
      const roleId = 1234
      const role = { name: 'role1' }

      dbMethodsStub.where.withArgs({ roleId: roleId }).returns({ first: sandbox.stub().returns(P.resolve(role)) })
      setupDatabase()

      RolesModel.getById(roleId)
        .then(result => {
          test.deepEqual(result, role)
          test.end()
        })
    })

    getByIdTest.end()
  })

  modelTest.test('save should', saveTest => {
    saveTest.test('insert role in db if roleId not defined', test => {
      const role = { name: 'role1' }

      dbMethodsStub.insert.withArgs(sandbox.match({ name: role.name }, '*')).returns(P.resolve([role]))
      setupDatabase()

      RolesModel.save(role)
        .then(result => {
          test.deepEqual(result, role)
          test.end()
        })
    })

    saveTest.test('update role in db if roleId defined', test => {
      const role = { name: 'role1', roleId: 'uuid' }

      let updateStub = sandbox.stub().returns(P.resolve([role]))
      dbMethodsStub.where.withArgs({ roleId: role.roleId }).returns({ update: updateStub })
      setupDatabase()

      RolesModel.save(role)
        .then(result => {
          test.ok(updateStub.withArgs(role, '*').calledOnce)
          test.deepEqual(result, role)
          test.end()
        })
    })

    saveTest.end()
  })

  modelTest.test('remove should', removeTest => {
    removeTest.test('destroy role in db', test => {
      const roleId = Uuid()

      dbMethodsStub.where.withArgs({ roleId: roleId }).returns({ del: sandbox.stub().returns(P.resolve(1)) })
      setupDatabase()

      RolesModel.remove(roleId)
        .then(result => {
          test.equal(result, 1)
          test.end()
        })
    })

    removeTest.end()
  })

  modelTest.end()
})
