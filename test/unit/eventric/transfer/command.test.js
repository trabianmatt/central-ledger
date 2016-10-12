'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Uuid = require('uuid4')
const P = require('bluebird')
const Commands = require(`${src}/eventric/transfer/commands`)
const Validator = require(`${src}/eventric/transfer/validator`)
const NotFoundError = require(`${src}/errors/not-found-error`)

Test('Commands Test', commandsTest => {
  let sandbox

  commandsTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Validator, 'validateExistingOnPrepare')
    Commands.$aggregate = sandbox.stub()
    Commands.$aggregate.load = sandbox.stub()
    Commands.$aggregate.create = sandbox.stub()
    t.end()
  })

  commandsTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  commandsTest.test('Prepare should', prepareTest => {
    prepareTest.test('return existing transfer', t => {
      let id = Uuid()
      let transfer = {}

      Commands.$aggregate.load.withArgs('Transfer', id).returns(P.resolve(transfer))
      Validator.validateExistingOnPrepare.returns(P.resolve(transfer))
      Commands.PrepareTransfer({ id: id })
      .then(result => {
        t.equal(result.existing, true)
        t.equal(result.transfer, transfer)
        t.end()
      })
    })

    prepareTest.test('return reject if error thrown on load', t => {
      let id = Uuid()
      let error = new Error('Some error')

      Commands.$aggregate.load.returns(P.reject(error))

      Commands.PrepareTransfer({ id: id })
      .then(() => {
        t.fail('Expected exception')
        t.end()
      })
      .catch(e => {
        t.equal(e, error)
        t.end()
      })
    })

    prepareTest.test('create new transfer if matching one does not exist', t => {
      let id = Uuid()
      let transfer = {
        $setIdForCreation: () => {},
        $save: () => P.resolve()
      }
      Commands.$aggregate.load.withArgs('Transfer', id).returns(P.reject(new Error(`No domainEvents for aggregate of type Transfer with ${id} available`)))
      Commands.$aggregate.create.returns(P.resolve(transfer))

      Commands.PrepareTransfer({ id: id })
      .then(result => {
        t.equal(result.existing, false)
        t.equal(result.transfer, transfer)
        t.end()
      })
    })

    prepareTest.end()
  })

  commandsTest.test('Fulfill should', fulfillTest => {
    fulfillTest.test('return NotFoundError if aggregate not found', t => {
      let id = Uuid()
      let fulfillment = 'test'

      Commands.$aggregate.load.withArgs('Transfer', id).returns(P.reject(new Error(`No domainEvents for aggregate of type Transfer with ${id} available`)))
      Commands.FulfillTransfer({ id: id, fulfillment: fulfillment })
      .then(fulfilled => {
        t.fail('Expected exception')
        t.end()
      })
      .catch(NotFoundError, e => {
        t.pass()
        t.end()
      })
      .catch(e => {
        t.fail('Wrong exception thrown')
        t.end()
      })
    })
    fulfillTest.end()
  })
  commandsTest.end()
})
