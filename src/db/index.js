'use strict'

const Massive = require('massive')
const Config = require(`${process.cwd()}/src/lib/config`)
const P = require('bluebird')

let connection
const scriptsDir = `${process.cwd()}/src/db`

function getConnection () {
  if (!connection) {
    connection = P.promisify(Massive.connect)({ connectionString: Config.DATABASE_URI, scripts: scriptsDir }).then(db => {
      P.promisifyAll(db)
      for (const prop in db) {
        if (db.hasOwnProperty(prop)) {
          const dbProp = db[prop]
          if (dbProp instanceof Object && !(dbProp instanceof Array) && !(dbProp instanceof Function)) {
            P.promisifyAll(dbProp)
          }
        }
      }
      return db
    })
  }
  return connection
}

function resetConnection () {
  connection = null
}

module.exports = {
  connect: getConnection,
  resetConnection: resetConnection
}
