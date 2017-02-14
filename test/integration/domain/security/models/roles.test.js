'use strict'

const Test = require('tape')
const Uuid = require('uuid4')
const Fixtures = require('../../../../fixtures')
const Model = require('../../../../../src/domain/security/models/roles')

const createRole = (name = Fixtures.generateRandomName(), permissions = 'test|test2') => ({ name, permissions })

Test('roles model', rolesTest => {
  rolesTest.test('save should', saveTest => {
    saveTest.test('save role to db', test => {
      const role = createRole()
      Model.save(role)
        .then(result => {
          test.ok(result.roleId)
          test.equal(result.name, role.name)
          test.notOk(result.description)
          test.equal(result.permissions, role.permissions)
          test.end()
        })
        .catch(test.end)
    })

    saveTest.test('save existing role', test => {
      const role = createRole()
      Model.save(role)
        .then(result => {
          result.name = 'new name'
          return result
        })
        .then(updatedRole => {
          Model.save(updatedRole)
            .then(result => {
              test.equal(result.name, 'new name')
              test.end()
            })
        })
        .catch(test.end)
    })
    saveTest.end()
  })

  rolesTest.test('getById should', getByIdTest => {
    getByIdTest.test('return saved role', test => {
      const role = createRole()
      Model.save(role)
        .then(result => Model.getById(result.roleId))
        .then(saved => {
          test.equal(saved.name, role.name)
          test.equal(saved.permissions, role.permissions)
          test.end()
        })
        .catch(test.end)
    })

    getByIdTest.test('return null if no role found', test => {
      Model.getById(Uuid())
        .then(result => {
          test.notOk(result)
          test.end()
        })
        .catch(test.end)
    })

    getByIdTest.end()
  })

  rolesTest.test('getAll should', getAllTest => {
    getAllTest.test('return all roles', test => {
      Model.getAll()
        .then(results => {
          test.ok(results.length > 0)
          test.end()
        })
        .catch(test.end)
    })

    getAllTest.end()
  })

  rolesTest.test('remove should', deleteTest => {
    deleteTest.test('destroy role by id', test => {
      const role = createRole()
      Model.save(role)
        .then(result => {
          const roleId = result.roleId
          return Model.getById(roleId)
            .then(r => test.ok(r))
            .then(() => Model.remove(roleId))
            .then(() => Model.getById(roleId))
            .then(r => test.notOk(r))
        })
        .then(test.end)
    })
    deleteTest.end()
  })

  rolesTest.end()
})
