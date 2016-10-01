const Test = require('tape')
const Uuid = require('uuid4')
const Config = require('../../../src/lib/config')
const UrlParser = require('../../../src/lib/urlparser')

Test('nameFromAccountUri', nameFromAccountUriTest => {
  nameFromAccountUriTest.test('return null if not url', t => {
    UrlParser.nameFromAccountUri('fjdklsjfld', (err, name) => {
      t.equal(err, 'no match')
      t.equal(name, null)
      t.end()
    })
  })

  nameFromAccountUriTest.test('return null if url not start with hostname', t => {
    UrlParser.nameFromAccountUri('http://test/accounts/name', (err, name) => {
      t.equal(err, 'no match')
      t.equal(name, null)
      t.end()
    })
  })

  nameFromAccountUriTest.test('return name if url matches pattern', t => {
    let hostName = Config.HOSTNAME
    let accountName = 'account1'
    UrlParser.nameFromAccountUri(`${hostName}/accounts/${accountName}`, (err, name) => {
      t.notOk(err)
      t.equal(name, accountName)
      t.end()
    })
  })

  nameFromAccountUriTest.test('return value if no callback provided', t => {
    let hostName = Config.HOSTNAME
    let accountName = 'account1'
    let result = UrlParser.nameFromAccountUri(`${hostName}/accounts/${accountName}`)
    t.equal(result, accountName)
    t.end()
  })

  nameFromAccountUriTest.end()
})

Test('idFromTransferUri', idFromTransferUriTest => {
  idFromTransferUriTest.test('err if not uri', t => {
    UrlParser.idFromTransferUri('not a uri', (err, id) => {
      t.equal(err, 'no match')
      t.equal(id, null)
      t.end()
    })
  })

  idFromTransferUriTest.test('err if not begins with hostname', t => {
    UrlParser.idFromTransferUri(`http://not-host-name/transfers/${Uuid()}`, (err, id) => {
      t.equal(err, 'no match')
      t.equal(id, null)
      t.end()
    })
  })

  idFromTransferUriTest.test('id if uri contains hostname and uuid', t => {
    let hostname = Config.HOSTNAME
    let transferId = Uuid()
    UrlParser.idFromTransferUri(`${hostname}/transfers/${transferId}`, (err, id) => {
      t.equal(err, null)
      t.equal(id, transferId)
      t.end()
    })
  })

  idFromTransferUriTest.test('return id if no callback provided', t => {
    let hostname = Config.HOSTNAME
    let transferId = Uuid()
    let result = UrlParser.idFromTransferUri(`${hostname}/transfers/${transferId}`)
    t.equal(result, transferId)
    t.end()
  })
  idFromTransferUriTest.end()
})

Test('toTransferUri', toTransferUriTest => {
  toTransferUriTest.test('return path', t => {
    let hostName = Config.HOSTNAME
    let id = Uuid()
    t.equal(UrlParser.toTransferUri(id), hostName + '/transfers/' + id)
    t.end()
  })
  toTransferUriTest.end()
})

Test('toAccountUri', toAccountUriTest => {
  toAccountUriTest.test('return path', t => {
    let hostName = Config.HOSTNAME
    let name = 'account-name'
    t.equal(UrlParser.toAccountUri(name), hostName + '/accounts/' + name)
    t.end()
  })
  toAccountUriTest.end()
})
