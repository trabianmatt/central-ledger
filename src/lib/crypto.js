'use strict'

const Sodium = require('sodium')
const Argon2 = require('argon2')
const P = require('bluebird')
const defaultSaltLength = 64
const defaultKeyLength = 74
const defaultSecretLength = 74

const argonOptions = {
  timeCost: 3,
  memoryCost: 13,
  parallelism: 2,
  argon2d: false
}

const generateBuffer = (size = defaultSaltLength) => {
  return new P((resolve) => {
    const buffer = Buffer.alloc(size)
    Sodium.api.randombytes_buf(buffer, size)
    resolve(buffer)
  })
}

const hash = (buffer) => {
  return generateBuffer(defaultSaltLength)
    .then(salt => Argon2.hash(buffer, salt, argonOptions))
}

const verifyHash = (hash, password) => {
  return Argon2.verify(hash, password)
}

module.exports = {
  generateKey: () => generateBuffer(defaultKeyLength),
  generateSecret: () => generateBuffer(defaultSecretLength),
  hash,
  verifyHash
}
