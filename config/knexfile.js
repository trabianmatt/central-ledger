'use strict'

const migrationsDirectory = '../migrations'

module.exports = {
  client: 'pg',
  connection: process.env.CLEDG_DATABASE_URI,
  migrations: {
    directory: migrationsDirectory,
    tableName: 'migrations',
    stub: `${migrationsDirectory}/migration.template`
  }
}
