'use strict'

const P = require('bluebird')
const Model = require('./model')
const ValidationError = require('../../errors/validation-error')
const UrlParser = require('../../lib/urlparser')
const Crypto = require('../../lib/crypto')

const createAccount = (name, key, secret) => {
  return Model.create({ name, key: key.toString('hex'), secret: secret.toString('hex') })
}

const createSecretAndHash = () => {
  return Crypto.generateSecret().then(secret => {
    return Crypto.hash(secret).then(hashedSecret => ({ secret, hashedSecret }))
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
            key: key.toString('hex'),
            secret: secret.toString('hex')
          }
        }))
    })
}

const exists = (accountUri) => {
  return new P((resolve, reject) => {
    UrlParser.nameFromAccountUri(accountUri, (err, result) => {
      if (err) reject(new ValidationError(`Invalid account URI: ${accountUri}`))
      resolve(result)
    })
  })
  .then(name => {
    return Model.getByName(name)
      .then(account => {
        if (account) return account
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

module.exports = {
  create,
  exists,
  getAll,
  getById,
  getByName
}
