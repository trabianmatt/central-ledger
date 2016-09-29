const Config = require('../../lib/config')

let extractUrls = (request) => {
  let urls = {}
  request.server.table()[0].table.filter(route => {
    return route.settings.id !== undefined &&
      Array.isArray(route.settings.tags) &&
      route.settings.tags.indexOf('api') >= 0
  }).forEach(route => {
    urls[route.settings.id] = `${Config.HOSTNAME}${route.path.replace(/\{/g, ':').replace(/\}/g, '')}`
  })
  let host = Config.HOSTNAME.replace(/^https?:\/\//, '')
  urls['account_transfers'] = `ws://${host}/accounts/:name/transfers`
  return urls
}

exports.health = (request, reply) => {
  reply({ status: 'OK' }).code(200)
}

exports.metadata = (request, reply) => {
  reply({
    currency_code: null,
    currency_symbol: null,
    ledger: Config.HOSTNAME,
    urls: extractUrls(request),
    precision: 10,
    scale: 2
  }).code(200)
}
