'use strict'

const Db = require('../lib/db')
const Uuid = require('uuid4')
const AlreadyPreparedError = require('../errors/already-prepared-error')

class PostgresStore {

  _getNextSequenceNumber (domainEvent) {
    return Db.connect().then(db => db.runAsync(`SELECT MAX("sequenceNumber") FROM "${this._tableName}" WHERE "aggregateId" = $1`, [domainEvent.aggregate.id])).then(
            (res, err) => {
              if (err) {
                console.log(err)
              } else {
                if (domainEvent.ensureIsFirstDomainEvent || res[0].max === null) {
                  return 1
                } else {
                  return res[0].max + 1
                }
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
    return new Promise(resolve => {
      this._tableName = this._context.name[0].toLowerCase() + this._context.name.substr(1) + 'DomainEvents'
      return resolve()
    }
        )
  }

  saveDomainEvent (domainEvent) {
    let self = this

    return this._getNextSequenceNumber(domainEvent).then(sequenceNumber =>
            Db.connect()
                .then(db =>
                    db[self._tableName].insertAsync(
                      {
                        eventId: Uuid(),
                        name: domainEvent.name,
                        payload: domainEvent.payload,
                        aggregateId: domainEvent.aggregate.id,
                        aggregateName: domainEvent.aggregate.name,
                        sequenceNumber: sequenceNumber,
                        timestamp: (new Date(domainEvent.timestamp)).toISOString()
                      })
                ).then(
                function (result) {
                  return self._toDomainEvent(result)
                }
                ).catch(e => {
                  if (e.message.includes('duplicate key value violates unique constraint') && sequenceNumber === 1) {
                    throw new AlreadyPreparedError()
                  }

                  throw e
                }))
  }

  findDomainEventsByName (domainEventNames, callback) {
    let self = this

    if (!(domainEventNames instanceof Array)) {
      domainEventNames = [domainEventNames]
    }

    return Db.connect().then(db => db[self._tableName].findAsync({ name: domainEventNames }))
            .then(result => callback(null, result.map(self._toDomainEvent.bind(self))))
  }

  findDomainEventsByAggregateId (aggregateIds, callback) {
    let self = this

    if (!(aggregateIds instanceof Array)) {
      aggregateIds = [aggregateIds]
    }

    return Db.connect().then(db => db[self._tableName].findAsync({ aggregateId: aggregateIds }))
            .then(result => callback(null, result.map(self._toDomainEvent.bind(self))))
  }

  findDomainEventsByNameAndAggregateId (domainEventNames, aggregateIds, callback) {
    let self = this

    if (!(domainEventNames instanceof Array)) {
      domainEventNames = [domainEventNames]
    }
    if (!(aggregateIds instanceof Array)) {
      aggregateIds = [aggregateIds]
    }
    return Db.connect().then(db => db[self._tableName].findAsync({ name: domainEventNames, aggregateId: aggregateIds }))
            .then(result => callback(null, result.map(self._toDomainEvent.bind(self))))
  }

  destroy () { }
}

exports.default = PostgresStore
