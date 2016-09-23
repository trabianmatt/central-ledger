var extractUrls = (request) => {
  var urls = {}
  request.server.table()[0].table.filter(route => {
    return route.settings.id !== undefined &&
      Array.isArray(route.settings.tags) &&
      route.settings.tags.indexOf('api') >= 0
  }).forEach(route => {
    urls[route.settings.id] = route.path.replace(/\{/g, ':').replace(/\}/g, '')
  })
  return urls
}

exports.health = (request, reply) => {
  reply({ status: 'OK' }).code(200)
}

exports.metadata = (request, reply) => {
  reply({
    currency_code: null,
    currency_symbol: null,
    urls: extractUrls(request),
    precision: 10,
    scale: 2
  }).code(200)
}
