'use strict'

const P = require('bluebird')
const Model = require('./model')
const ValidationError = require('../../errors').ValidationError
const UrlParser = require('../../lib/urlparser')
const Crypto = require('../../lib/crypto')

const createAccount = (name, hashedPassword) => {
  return Model.create({ name, hashedPassword })
}

const create = (payload) => {
  return Crypto.hash(payload.password)
    .then(hashedPassword => {
      return createAccount(payload.name, hashedPassword)
        .then(account => ({
          accountId: account.accountId,
          name: account.name,
          createdDate: account.createdDate
        }))
    })
}

const createLedgerAccount = (name, password) => {
  return Model.getByName(name)
    .then(account => {
      if (!account) {
        return create({ name, password })
      }
      return account
    })
}

const exists = (accountUri) => {
  return new P((resolve, reject) => {
    UrlParser.nameFromAccountUri(accountUri, (err, result) => {
      if (err) {
        reject(new ValidationError(`Invalid account URI: ${accountUri}`))
      }
      resolve(result)
    })
  })
    .then(name => {
      return Model.getByName(name)
        .then(account => {
          if (account) {
            return account
          }
          throw new ValidationError(`Account ${name} not found`)
        })
    })
}

const getAll = () => {
  return Model.getAll()
}

const getById = (id) => {
  return Model.getById(id)
}

const getByName = (name) => {
  return Model.getByName(name)
}

const accountExists = (account) => {
  if (account) {
    return account
  }
  throw new Error('Account does not exist')
}

const update = (name, payload) => {
  return Model.getByName(name).then(account => {
    return Model.update(account, payload.is_disabled)
  })
}

const retrieveUserCredentials = (account) => {
  return Model.retrieveUserCredentials(account)
}

const verifyUserCredentials = (account, userCredentials, password) => {
  return Crypto.verifyHash(userCredentials.password, password)
    .then(match => {
      if (match) {
        return account
      }
      throw new Error('Username and password are invalid')
    })
}

const verify = (name, password) => {
  return Model.getByName(name)
    .then(accountExists)
    .then(account => retrieveUserCredentials(account)
      .then(userCredentials => verifyUserCredentials(account, userCredentials, password)))
}

module.exports = {
  create,
  createLedgerAccount,
  exists,
  getAll,
  getById,
  getByName,
  verify,
  update
}
