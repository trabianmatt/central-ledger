const Massive = require('massive')
const Config = require('../lib/config')
const p = require('bluebird')

let connection

function getConnection () {
  if (!connection) {
    connection = p.promisify(Massive.connect)({ connectionString: Config.DATABASE_URI }).then(db => {
      p.promisifyAll(db)
      for (let prop in db) {
        let dbProp = db[prop]
        if (dbProp instanceof Object && !(dbProp instanceof Array) && !(dbProp instanceof Function)) {
          p.promisifyAll(dbProp)
        }
      }
      return db
    })
  }
  return connection
}

module.exports = {
  connect: getConnection
}
