'use strict'

const Test = require('tape')
const Pack = require('../../package')
const Config = require('../../src/lib/config')
const Manifest = require('../../src/manifest')

Test('manifest', function (manifestTest) {
  manifestTest.test('connections should', function (connectionsTest) {
    connectionsTest.test('have connections section', function (assert) {
      assert.ok(Manifest.connections)
      assert.end()
    })

    connectionsTest.test('have one connection with configured port', function (assert) {
      assert.equal(Manifest.connections.length, 1)
      assert.equal(Manifest.connections[0].port, Config.PORT)
      assert.end()
    })

    connectionsTest.end()
  })

  manifestTest.test('registrations should', function (registrationsTest) {
    registrationsTest.test('have registrations section', function (assert) {
      assert.ok(Manifest.registrations)
      assert.end()
    })

    registrationsTest.test('register inert plugin', function (assert) {
      assert.ok(findPluginByPath(Manifest.registrations, 'inert'))
      assert.end()
    })

    registrationsTest.test('register vision plugin', function (assert) {
      assert.ok(findPluginByPath(Manifest.registrations, 'vision'))
      assert.end()
    })

    registrationsTest.test('register hapi-swagger plugin', function (assert) {
      let found = findPluginByRegisterName(Manifest.registrations, 'hapi-swagger')

      assert.ok(found)
      assert.equal(found.plugin.options.info.title, 'Central Ledger API Documentation')
      assert.equal(found.plugin.options.info.version, Pack.version)
      assert.end()
    })

    registrationsTest.test('register blipp plugin', function (assert) {
      assert.ok(findPluginByPath(Manifest.registrations, 'blipp'))
      assert.end()
    })

    registrationsTest.test('register api plugin', function (assert) {
      assert.ok(findPluginByPath(Manifest.registrations, './api'))
      assert.end()
    })

    registrationsTest.test('register webhooks plugin', function (assert) {
      assert.ok(findPluginByPath(Manifest.registrations, './webhooks'))
      assert.end()
    })

    registrationsTest.test('register sockets plugin', function (assert) {
      assert.ok(findPluginByPath(Manifest.registrations, './sockets'))
      assert.end()
    })

    registrationsTest.test('register good plugin', function (assert) {
      let found = findPluginByRegisterName(Manifest.registrations, 'good')

      assert.ok(found)
      assert.equal(found.plugin.options.reporters.console.length, 3)
      assert.equal(found.plugin.options.reporters.console[0].module, 'good-squeeze')
      assert.equal(found.plugin.options.reporters.console[1].module, 'good-console')
      assert.equal(found.plugin.options.reporters.console[2], 'stdout')
      assert.end()
    })

    registrationsTest.end()
  })

  manifestTest.end()
})

function findPluginByPath (plugins, path) {
  return plugins.find(function (p) {
    return p.plugin && (typeof p.plugin === 'string') && p.plugin === path
  })
}

function findPluginByRegisterName (plugins, registerName) {
  return plugins.find(function (p) {
    return p.plugin && (typeof p.plugin === 'object') && p.plugin.register && p.plugin.register === registerName
  })
}
