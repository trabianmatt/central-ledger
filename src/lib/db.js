const Massive = require('massive')
const Config = require('../lib/config')
const P = require('bluebird')

let connection

function getConnection () {
  if (!connection) {
    connection = P.promisify(Massive.connect)({ connectionString: Config.DATABASE_URI }).then(db => {
      P.promisifyAll(db)
      for (let prop in db) {
        let dbProp = db[prop]
        if (dbProp instanceof Object && !(dbProp instanceof Array) && !(dbProp instanceof Function)) {
          P.promisifyAll(dbProp)
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
