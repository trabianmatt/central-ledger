'use strict'

const P = require('bluebird')
const Model = require('./model')
const ValidationError = require('../../errors/validation-error')
const UrlParser = require('../../lib/urlparser')
const Crypto = require('../../lib/crypto')

const createAccount = (name, key, secret) => {
  return Model.create({ name, key, secret })
}

const createSecretAndHash = () => {
  return Crypto.generateSecret().then(secret => {
    return Crypto.hash(secret).then(hashedSecret => ({
      secret,
      hashedSecret: hashedSecret
    }))
  })
}

const createKeyAndSecret = () => {
  return P.all([Crypto.generateKey(), createSecretAndHash()])
    .then(results => {
      return { key: results[0], secret: results[1].secret, hashedSecret: results[1].hashedSecret }
    })
}

const create = ({ name }) => {
  return createKeyAndSecret()
    .then(({key, secret, hashedSecret}) => {
      return createAccount(name, key, hashedSecret)
        .then(account => ({
          accountId: account.accountId,
          name: account.name,
          createdDate: account.createdDate,
          credentials: {
            key,
            secret
          }
        }))
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

const getByKey = (key) => {
  return Model.getByKey(key)
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

const verifyAccountSecret = (account, secret) => {
  return Crypto.verifyHash(account.secret, secret)
    .then(match => {
      if (match) {
        return account
      }
      throw new Error('Secret is not valid for account')
    })
}

const verify = (key, secret) => {
  return Model.getByKey(key)
    .then(accountExists)
    .then(account => verifyAccountSecret(account, secret))
}

module.exports = {
  create,
  exists,
  getAll,
  getById,
  getByKey,
  getByName,
  verify
}
