'use strict'

const Glob = require('glob')

exports.register = function (server, options, next) {
  Glob.sync('**/routes.js', { cwd: __dirname }).forEach(function (x) {
    server.route(require('./' + x))
  })

  next()
}

exports.register.attributes = {
  name: 'admin routes'
}
