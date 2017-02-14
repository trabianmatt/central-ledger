'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Uuid = require('uuid4')
const Db = require('../../../../../src/db')
const RolesModel = require('../../../../../src/domain/security/models/roles')

Test('Roles model', modelTest => {
  let sandbox

  modelTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    test.end()
  })

  modelTest.afterEach(test => {
    sandbox.restore()
    test.end()
  })

  const setupRolesDb = (roles = {}) => {
    sandbox.stub(Db, 'connect').returns(P.resolve({ roles }))
  }

  modelTest.test('getAll should', getAllTest => {
    getAllTest.test('findAll roles in db', test => {
      const roles = [{ name: 'role1' }, { name: 'role2' }]
      const findAsync = sandbox.stub()
      findAsync.withArgs({}).returns(P.resolve(roles))
      setupRolesDb({ findAsync })

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
      const findOneAsync = sandbox.stub()
      findOneAsync.withArgs({ roleId }).returns(P.resolve(role))
      setupRolesDb({ findOneAsync })

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
      const insertAsync = sandbox.stub()
      insertAsync.withArgs(role).returns(P.resolve(role))
      setupRolesDb({ insertAsync })

      RolesModel.save(role)
        .then(result => {
          test.ok(insertAsync.calledWith(role))
          test.deepEqual(result, role)
          test.end()
        })
    })

    saveTest.test('update role in db if roleId defined', test => {
      const role = { name: 'role1', roleId: 'uuid' }
      const updateAsync = sandbox.stub()
      updateAsync.withArgs(role).returns(P.resolve(role))
      setupRolesDb({ updateAsync })

      RolesModel.save(role)
        .then(result => {
          test.ok(updateAsync.calledWith(role))
          test.deepEqual(result, role)
          test.end()
        })
    })
    saveTest.end()
  })

  modelTest.test('remove should', removeTest => {
    removeTest.test('destroy role in db', test => {
      const roleId = Uuid()
      const destroyAsync = sandbox.stub()
      destroyAsync.withArgs({ roleId }).returns(P.resolve(1))
      setupRolesDb({ destroyAsync })

      RolesModel.remove(roleId)
        .then(result => {
          test.ok(destroyAsync.calledWith({ roleId }))
          test.equal(result, 1)
          test.end()
        })
    })

    removeTest.end()
  })

  modelTest.end()
})
