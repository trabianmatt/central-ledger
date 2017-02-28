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
  let rolesStubs
  let userRolesStubs

  const rolesTable = 'roles'
  const userRolesTable = 'userRoles'

  modelTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    rolesStubs = {
      insert: sandbox.stub(),
      where: sandbox.stub(),
      select: sandbox.stub()
    }
    userRolesStubs = {
      insert: sandbox.stub(),
      where: sandbox.stub(),
      select: sandbox.stub()
    }
    sandbox.stub(Db, 'connect')
    dbConnection = sandbox.stub()
    dbConnection.withArgs(rolesTable).returns(rolesStubs)
    dbConnection.withArgs(userRolesTable).returns(userRolesStubs)
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

      rolesStubs.select.returns(P.resolve(roles))

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

      rolesStubs.where.withArgs({ roleId: roleId }).returns({ first: sandbox.stub().returns(P.resolve(role)) })

      RolesModel.getById(roleId)
        .then(result => {
          test.deepEqual(result, role)
          test.end()
        })
    })

    getByIdTest.end()
  })

  modelTest.test('addUserRole should', addUserRoleTest => {
    addUserRoleTest.test('insert userRole in db', test => {
      const userRole = { userId: Uuid(), roleId: Uuid() }
      userRolesStubs.insert.withArgs(userRole, '*').returns(P.resolve([userRole]))
      RolesModel.addUserRole(userRole)
        .then(result => {
          test.deepEqual(result, userRole)
          test.end()
        })
    })

    addUserRoleTest.end()
  })

  modelTest.test('save should', saveTest => {
    saveTest.test('insert role in db if roleId not defined', test => {
      const role = { name: 'role1' }

      rolesStubs.insert.withArgs(sandbox.match({ name: role.name }, '*')).returns(P.resolve([role]))

      RolesModel.save(role)
        .then(result => {
          test.deepEqual(result, role)
          test.end()
        })
    })

    saveTest.test('update role in db if roleId defined', test => {
      const role = { name: 'role1', roleId: 'uuid' }

      const updateStub = sandbox.stub().returns(P.resolve([role]))
      rolesStubs.where.withArgs({ roleId: role.roleId }).returns({ update: updateStub })

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

      rolesStubs.where.withArgs({ roleId: roleId }).returns({ del: sandbox.stub().returns(P.resolve(1)) })

      RolesModel.remove(roleId)
        .then(result => {
          test.equal(result, 1)
          test.end()
        })
    })

    removeTest.end()
  })

  modelTest.test('removeUserRoles should', removeUserRolesTest => {
    removeUserRolesTest.test('delete userRoles by userId in db', test => {
      const userId = Uuid()

      userRolesStubs.where.withArgs({ userId }).returns({ del: sandbox.stub().returns(P.resolve(1)) })

      RolesModel.removeUserRoles(userId)
        .then(result => {
          test.ok(userRolesStubs.where.calledWith({ userId }))
          test.equal(result, 1)
          test.end()
        })
    })
    removeUserRolesTest.end()
  })

  modelTest.test('getUserRoles should', getUserRolesTest => {
    getUserRolesTest.test('find roles by userId', test => {
      const userId = Uuid()
      const roles = [{}, {}]

      const joinStub = sandbox.stub()
      const whereStub = sandbox.stub()
      const selectStub = sandbox.stub()

      selectStub.withArgs('r.*').returns(P.resolve(roles))
      whereStub.returns({ select: selectStub })
      joinStub.returns({ where: whereStub })

      rolesStubs.innerJoin = joinStub

      dbConnection.withArgs('roles AS r').returns(rolesStubs)

      RolesModel.getUserRoles(userId)
        .then(results => {
          test.equal(results, roles)
          test.ok(joinStub.calledWith('userRoles as ur', 'r.roleId', 'ur.roleId'))
          test.ok(whereStub.calledWith('ur.userId', userId))
          test.end()
        })
    })

    getUserRolesTest.end()
  })

  modelTest.end()
})
