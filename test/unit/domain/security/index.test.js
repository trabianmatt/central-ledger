'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Uuid = require('uuid4')

const Errors = require('../../../../src/errors')
const RolesModel = require('../../../../src/domain/security/models/roles')
const SecurityService = require('../../../../src/domain/security')

Test('SecurityService test', serviceTest => {
  let sandbox

  serviceTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(RolesModel)
    test.end()
  })

  serviceTest.afterEach(test => {
    sandbox.restore()
    test.end()
  })

  serviceTest.test('getAllRoles should', getAllRolesTest => {
    getAllRolesTest.test('return all roles from model', test => {
      const roles = [{ name: 'role1' }, { name: 'role2' }]
      RolesModel.getAll.returns(P.resolve(roles))

      SecurityService.getAllRoles()
        .then(result => {
          test.deepEqual(result, roles)
          test.end()
        })
    })

    getAllRolesTest.test('remove createdDate and expand permissions', test => {
      const roles = [{ name: 'role1', createdDate: new Date(), permissions: 'PERMISSION1|PERMISSION2' }]
      RolesModel.getAll.returns(P.resolve(roles))

      SecurityService.getAllRoles()
        .then(result => {
          test.deepEqual(result[0], { name: 'role1', permissions: ['PERMISSION1', 'PERMISSION2'] })
          test.end()
        })
    })

    getAllRolesTest.end()
  })

  serviceTest.test('createRole should', createTest => {
    createTest.test('save role to model', test => {
      const role = { name: 'role1' }
      RolesModel.save.returns(P.resolve(role))

      SecurityService.createRole(role)
        .then(result => {
          test.ok(RolesModel.save.calledWith(Sinon.match(role)))
          test.deepEqual(result, role)
          test.end()
        })
    })

    createTest.test('convert permissions array to string', test => {
      const role = { name: 'role1', permissions: ['PERMISSION1', 'PERMISSION2'] }
      RolesModel.save.returns(P.resolve({}))

      SecurityService.createRole(role)
        .then(result => {
          test.ok(RolesModel.save.calledWith(Sinon.match({ name: 'role1', permissions: 'PERMISSION1|PERMISSION2' })))
          test.end()
        })
    })

    createTest.test('remove createdDate and expand permissions', test => {
      const role = { name: 'role1', createdDate: new Date(), permissions: 'PERMISSION1|PERMISSION2' }
      RolesModel.save.returns(P.resolve(role))

      SecurityService.createRole({})
        .then(result => {
          test.deepEqual(result, { name: 'role1', permissions: ['PERMISSION1', 'PERMISSION2'] })
          test.end()
        })
    })

    createTest.end()
  })

  serviceTest.test('updateRole should', updateTest => {
    updateTest.test('find existing role and update properties', test => {
      const roleId = Uuid()
      const role = { roleId, name: 'role1', permissions: 'PERMISSION1|PERMISSION2', description: 'Some role' }
      RolesModel.getById.withArgs(roleId).returns(P.resolve(role))
      RolesModel.save.returns(P.resolve({}))
      const newRole = { name: 'role2', permissions: ['PERMISSION3'] }
      SecurityService.updateRole(roleId, newRole)
        .then(result => {
          test.equal(RolesModel.save.callCount, 1)
          const savedRole = RolesModel.save.firstCall.args[0]
          test.equal(savedRole.roleId, roleId)
          test.equal(savedRole.name, newRole.name)
          test.equal(savedRole.permissions, newRole.permissions[0])
          test.equal(savedRole.description, role.description)
          test.end()
        })
    })

    updateTest.test('return NotFoundError if role does not exist', test => {
      const roleId = Uuid()
      RolesModel.getById.withArgs(roleId).returns(P.resolve(null))
      SecurityService.updateRole(roleId, { name: 'test' })
        .then(() => test.fail('Expected exception'))
        .catch(Errors.NotFoundError, e => {
          test.equal(e.message, 'Role does not exist')
          test.end()
        })
        .catch(e => test.fail('Expected NotFoundError'))
    })

    updateTest.end()
  })

  serviceTest.test('deleteRole should', deleteTest => {
    deleteTest.test('remove role from model', test => {
      const roleId = Uuid()
      RolesModel.remove.withArgs(roleId).returns(P.resolve([{ name: 'role1' }]))
      SecurityService.deleteRole(roleId)
        .then(result => {
          test.equal(RolesModel.remove.callCount, 1)
          test.ok(RolesModel.remove.calledWith(roleId))
          test.end()
        })
    })

    deleteTest.test('throw NotFoundError if no rows deleted', test => {
      const roleId = Uuid()
      RolesModel.remove.returns(P.resolve([]))
      SecurityService.deleteRole(roleId)
        .then(() => test.fail('expected exception'))
        .catch(Errors.NotFoundError, e => {
          test.equal(e.message, 'Role does not exist')
          test.end()
        })
        .catch(e => test.fail('Expected NotFoundError'))
    })

    deleteTest.end()
  })

  serviceTest.end()
})
