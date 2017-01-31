'use strict'

const Massive = require('massive')
const Config = require(`${process.cwd()}/src/lib/config`)
const P = require('bluebird')
const scriptsDir = `${process.cwd()}/src/db`

let connection

const promisifyChildren = (db) => {
  for (const prop in db) {
    if (!db.hasOwnProperty(prop)) {
      continue
    }
    const dbProp = db[prop]
    if (dbProp instanceof Object && !(dbProp instanceof Array) && !(dbProp instanceof Function)) {
      P.promisifyAll(dbProp)
    }
  }
}

const getConnection = () => {
  if (!connection) {
    connection = P.promisify(Massive.connect)({ connectionString: Config.DATABASE_URI, scripts: scriptsDir }).then(db => {
      P.promisifyAll(db)
      promisifyChildren(db)
      return db
    })
  }
  return connection
}

const resetConnection = () => {
  connection = null
}

module.exports = {
  connect: getConnection,
  resetConnection: resetConnection
}
