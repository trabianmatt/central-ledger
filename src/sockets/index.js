let glob = require('glob')

exports.register = function (server, options, next) {
  glob.sync('**/routes.js', { cwd: __dirname }).forEach(function (x) {
    require('./' + x)(server)
  })

  next()
}

exports.register.attributes = {
  name: 'sockets'
}
