const Massive = require('massive')
const Config = require('../lib/config')
const p = require('bluebird')

var connection = p.promisify(Massive.connect)({ connectionString: Config.DATABASE_URI }).then(db => {
  for (var prop in db) {
    var dbProp = db[prop]
    if (dbProp instanceof Object && !(dbProp instanceof Array) && !(dbProp instanceof Function)) {
      p.promisifyAll(dbProp)
    }
  }
  return db
})

module.exports = {
  connect: connection
}
