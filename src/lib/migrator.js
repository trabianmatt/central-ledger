'use strict'

const DbMigrate = require('db-migrate')
const Config = require('./config')
const MigrateConfig = require('../../config/db-migrate.json')

exports.migrate = function () {
  let dbMigrate = DbMigrate.getInstance(true, buildOptions())
  return dbMigrate.up()
}

function buildOptions () {
  MigrateConfig.local = Config.DATABASE_URI
  return {
    config: MigrateConfig
  }
}
