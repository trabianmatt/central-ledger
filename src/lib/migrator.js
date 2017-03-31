'use strict'

const Path = require('path')
const Knex = require('knex')
const Knexfile = require('../../config/knexfile')

exports.migrate = function () {
  return Knex(updateMigrationsLocation(Knexfile)).migrate.latest()
}

const updateMigrationsLocation = (kf) => {
  const parsed = Path.parse(kf.migrations.directory)
  kf.migrations.directory = Path.join(process.cwd(), parsed.base)
  return kf
}
