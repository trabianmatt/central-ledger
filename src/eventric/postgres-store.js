'use strict'

const Db = require('../lib/db')
const Uuid = require('uuid4')
const AlreadyExistsError = require('../errors/already-exists-error')

class PostgresStore {
  constructor () {
    this._getNextSequenceNumber = this._getNextSequenceNumber.bind(this)
    this._toDomainEvent = this._toDomainEvent.bind(this)
  }

  _getNextSequenceNumber (db, domainEvent) {
    return db.runAsync(`SELECT MAX("sequenceNumber") FROM "${this._tableName}" WHERE "aggregateId" = $1`, [domainEvent.aggregate.id])
      .then(result => {
        if (domainEvent.ensureIsFirstDomainEvent || result[0].max === null) {
          return 1
        } else {
          return result[0].max + 1
        }
      })
  }

  _toDomainEvent (event) {
    return {
      id: event.sequenceNumber,
      name: event.name,
      payload: event.payload,
      aggregate: { id: event.aggregateId, name: event.aggregateName },
      context: this._context.name,
      timestamp: (new Date(event.timestamp)).getTime()
    }
  }

  initialize (context) {
    this._context = context
    return Promise.resolve().then(() => {
      this._tableName = this._context.name[0].toLowerCase() + this._context.name.substr(1) + 'DomainEvents'
      return this
    })
  }

  saveDomainEvent (domainEvent) {
    return Db.connect().then(db => {
      return this._getNextSequenceNumber(db, domainEvent).then(sequenceNumber => {
        return db[this._tableName].insertAsync({
          eventId: Uuid(),
          name: domainEvent.name,
          payload: domainEvent.payload,
          aggregateId: domainEvent.aggregate.id,
          aggregateName: domainEvent.aggregate.name,
          sequenceNumber: sequenceNumber,
          timestamp: (new Date(domainEvent.timestamp)).toISOString()
        })
        .catch(e => {
          if (e.message.includes('duplicate key value violates unique constraint') && sequenceNumber === 1) {
            throw new AlreadyExistsError()
          }
          throw e
        })
      })
    })
    .then(result => this._toDomainEvent(result))
  }

  findDomainEventsByName (domainEventNames, callback) {
    if (!(domainEventNames instanceof Array)) {
      domainEventNames = [domainEventNames]
    }
    Db.connect()
    .then(db => {
      db[this._tableName].find({ name: domainEventNames }, (err, result) => {
        if (err) callback(err)
        else callback(null, result.map(this._toDomainEvent))
      })
    }).catch(e => callback(e, null))
  }

  findDomainEventsByAggregateId (aggregateIds, callback) {
    if (!(aggregateIds instanceof Array)) {
      aggregateIds = [aggregateIds]
    }
    Db.connect()
    .then(db => {
      db[this._tableName].find({ aggregateId: aggregateIds }, (err, result) => {
        if (err) callback(err)
        else callback(null, result.map(this._toDomainEvent))
      })
    })
  }

  findDomainEventsByNameAndAggregateId (domainEventNames, aggregateIds, callback) {
    if (!(domainEventNames instanceof Array)) {
      domainEventNames = [domainEventNames]
    }
    if (!(aggregateIds instanceof Array)) {
      aggregateIds = [aggregateIds]
    }
    Db.connect()
    .then(db => db[this._tableName].find({ name: domainEventNames, aggregateId: aggregateIds }, (err, result) => {
      if (err) callback(err)
      else callback(null, result.map(this._toDomainEvent))
    }))
  }

  destroy () { }
}

exports.default = PostgresStore
