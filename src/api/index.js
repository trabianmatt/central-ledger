let glob = require('glob')

exports.register = function (server, options, next) {
  glob.sync('**/routes.js', { cwd: __dirname }).forEach(function (x) {
    server.route(require('./' + x))
  })

  next()
}

exports.register.attributes = {
  name: 'routes'
}
