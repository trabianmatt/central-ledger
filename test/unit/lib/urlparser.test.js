const Test = require('tape')
const Uuid = require('uuid4')
const Config = require('../../../src/lib/config')
const UrlParser = require('../../../src/lib/urlparser')

Test('parseAccountName', parseAccountNameTest => {
  parseAccountNameTest.test('return null if not url', t => {
    UrlParser.parseAccountName('fjdklsjfld', (err) => {
      t.equal(err, 'no match')
      t.end()
    })
  })

  parseAccountNameTest.test('return null if url not start with hostname', t => {
    UrlParser.parseAccountName('http://test/accounts/name', (err) => {
      t.equal(err, 'no match')
      t.end()
    })
  })

  parseAccountNameTest.test('return name if url matches pattern', t => {
    let hostName = Config.HOSTNAME
    let accountName = 'account1'
    UrlParser.parseAccountName(`${hostName}/accounts/${accountName}`, (err, name) => {
      t.notOk(err)
      t.equal(name, accountName)
      t.end()
    })
  })
  parseAccountNameTest.end()
})

Test('toTransferUri', toTransferUriTest => {
  toTransferUriTest.test('return path', t => {
    let hostName = Config.HOSTNAME
    let id = Uuid()
    t.equal(UrlParser.toTransferUri(id), hostName + '/transfers/' + id)
    t.end()
  })
})

Test('toAccountUri', toAccountUriTest => {
  toAccountUriTest.test('return path', t => {
    let hostName = Config.HOSTNAME
    let name = 'account-name'
    t.equal(UrlParser.toAccountUri(name), hostName + '/accounts/' + name)
    t.end()
  })
})
