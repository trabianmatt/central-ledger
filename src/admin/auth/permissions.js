'use strict'

class Permission {
  constructor (key, description) {
    this.key = key
    this.description = description
  }
}

const permissions = {
  ACCOUNTS_GET: new Permission('ACCOUNTS_GET', 'Retreive all accounts'),
  ACCOUNTS_UPDATE: new Permission('ACCOUNTS_UPDATE', 'Update account')
}

module.exports = permissions
