'use strict'

const Knex = require('knex')
const P = require('bluebird')
const Util = require('../lib/util')
const Config = require('../lib/config')

let connection

const getConnection = () => {
  if (!connection) {
    connection = new P((resolve, reject) => {
      const knexConfig = {
        postgres: { client: 'pg' }
      }

      const dbType = parseDatabaseType(Config.DATABASE_URI)
      if (!knexConfig[dbType]) {
        reject(new Error('Invalid database type in DATABASE_URI'))
      } else {
        let commonConfig = { connection: Config.DATABASE_URI }
        resolve(Knex(Util.assign(commonConfig, knexConfig[dbType])))
      }
    })
  }
  return connection
}

const resetConnection = () => {
  connection = null
}

const parseDatabaseType = (uri) => {
  return uri.split(':')[0]
}

module.exports = {
  connect: getConnection,
  resetConnection: resetConnection
}
