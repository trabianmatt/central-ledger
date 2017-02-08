'use strict'

const Db = require('../db')
const Uuid = require('uuid4')

class PostgresStore {
  constructor () {
    this._getNextSequenceNumber = this._getNextSequenceNumber.bind(this)
    this._toDomainEvent = this._toDomainEvent.bind(this)
    this._insertDomainEvent = this._insertDomainEvent.bind(this)
    this._findAsync = this._findAsync.bind(this)
  }

  _findAsync (criteria, callback) {
    Db.connect()
    .then(db => db[this._tableName].findAsync(criteria))
    .then(results => callback(null, results.map(this._toDomainEvent)))
    .catch(e => callback(e, null))
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

  _insertDomainEvent (db, sequenceNumber, domainEvent) {
    return db[this._tableName].insertAsync({
      eventId: Uuid(),
      name: domainEvent.name,
      payload: domainEvent.payload,
      aggregateId: domainEvent.aggregate.id,
      aggregateName: domainEvent.aggregate.name,
      sequenceNumber: sequenceNumber,
      timestamp: (new Date(domainEvent.timestamp)).toISOString()
    })
  }

  initialize (context) {
    this._context = context
    return Promise.resolve().then(() => {
      this._tableName = this._context.name[0].toLowerCase() + this._context.name.substr(1) + 'DomainEvents'
      return this
    })
  }

  saveDomainEvent (domainEvent) {
    return Db.connect()
    .then(db => this._getNextSequenceNumber(db, domainEvent)
        .then(sequenceNumber => this._insertDomainEvent(db, sequenceNumber, domainEvent))
    )
    .then(result => this._toDomainEvent(result))
  }

  findDomainEventsByName (domainEventNames, callback) {
    this._findAsync({ name: [].concat(domainEventNames) }, callback)
  }

  findDomainEventsByAggregateId (aggregateIds, callback) {
    this._findAsync({ aggregateId: [].concat(aggregateIds) }, callback)
  }

  findDomainEventsByNameAndAggregateId (domainEventNames, aggregateIds, callback) {
    this._findAsync({ name: [].concat(domainEventNames), aggregateId: [].concat(aggregateIds) }, callback)
  }

  destroy () { }
}

exports.default = PostgresStore
