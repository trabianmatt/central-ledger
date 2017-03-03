'use strict'

const Knex = require('knex')
const P = require('bluebird')
const Util = require('../lib/util')
const Config = require('../lib/config')

function Database () {
  this.connection = null
  this.tables = [
    'accounts',
    'userCredentials',
    'charges',
    'fees',
    'roles',
    'userRoles',
    'users',
    'tokens',
    'transfers',
    'executedTransfers',
    'settledTransfers',
    'settlements'
  ]
}

Database.prototype.connect = function () {
  if (!this.connection) {
    return createConnection(Config.DATABASE_URI).then(conn => {
      this.connection = conn
      this._setupTableObjects()
      return conn
    })
  }
  return P.resolve(this.connection)
}

Database.prototype._setupTableObjects = function () {
  this.tables.forEach(tbl => {
    this[tbl] = () => this.connection(tbl)
  })
}

const createConnection = function (databaseUri) {
  return new P((resolve, reject) => {
    const knexConfig = {
      postgres: { client: 'pg' }
    }

    const dbType = parseDatabaseType(databaseUri)
    if (!knexConfig[dbType]) {
      reject(new Error('Invalid database type in database URI'))
    } else {
      let commonConfig = { connection: databaseUri }
      resolve(Knex(Util.assign(commonConfig, knexConfig[dbType])))
    }
  })
}

const parseDatabaseType = (uri) => {
  return uri.split(':')[0]
}

module.exports = exports = new Database()
