'use strict'

function AccountListeners () {
  this._accounts = {}
}

AccountListeners.prototype._getNameSockets = function (name) {
  var nameArray = this._accounts[name] = this._accounts[name] || []
  return nameArray
}

AccountListeners.prototype.add = function (name, ws) {
  let n = this._getNameSockets(name)
  n.push(ws)
  ws.once('close', () => {
    n.splice(n.indexOf(ws), 1)
  })
}

AccountListeners.prototype.send = function (name, message) {
  let sockets = this._getNameSockets(name)
  sockets.forEach(s => {
    s.send(JSON.stringify(message))
  })
}

module.exports = AccountListeners
