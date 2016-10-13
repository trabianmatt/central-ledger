'use strict'

const Path = require('path')
const DbMigrate = require('db-migrate')

exports.migrate = function () {
  let dbMigrate = DbMigrate.getInstance(true, buildOptions())
  return dbMigrate.up()
}

function buildOptions () {
  let configPath = Path.join(process.cwd(), 'config/db-migrate.json')
  return {
    config: configPath
  }
}
