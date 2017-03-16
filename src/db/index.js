'use strict'

const Knex = require('knex')
const P = require('bluebird')
const Table = require('./table')
const Util = require('../lib/util')
const Config = require('../lib/config')

class Database {
  constructor () {
    this._knex = null
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

  connect () {
    if (!this._knex) {
      return configureKnex(Config.DATABASE_URI).then(k => {
        this._knex = k
        this._setupTableObjects()
        return k
      })
    }
    return P.resolve(this._knex)
  }

  disconnect () {
    if (this._knex) {
      this._removeTableObjects()
      this._knex.destroy()
      this._knex = null
    }
  }

  from (tableName) {
    if (!this._knex) {
      throw new Error('The database must be connected to get a table object')
    }
    return new Table(tableName, this._knex)
  }

  _setupTableObjects () {
    this.tables.forEach(t => {
      Object.defineProperty(this, t, {
        get: () => {
          return new Table(t, this._knex)
        },
        configurable: true,
        enumerable: true
      })
    })
  }

  _removeTableObjects () {
    this.tables.forEach(t => delete this[t])
  }
}

const configureKnex = function (databaseUri) {
  return new P((resolve, reject) => {
    const knexConfig = {
      postgres: { client: 'pg' }
    }

    const dbType = parseDatabaseType(databaseUri)
    if (!knexConfig[dbType]) {
      reject(new Error('Invalid database type in database URI'))
    } else {
      const commonConfig = { connection: databaseUri }
      resolve(Knex(Util.assign(commonConfig, knexConfig[dbType])))
    }
  })
}

const parseDatabaseType = (uri) => {
  return uri.split(':')[0]
}

module.exports = exports = new Database()
