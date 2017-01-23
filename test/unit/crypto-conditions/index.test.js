'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Conditions = require('../../../src/crypto-conditions')
const ValidationError = require('../../../src/errors/validation-error')
const FiveBellsConditions = require('five-bells-condition')

Test('crypto conditions', conditionsTest => {
  let sandbox

  conditionsTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(FiveBellsConditions, 'validateCondition')
    sandbox.stub(FiveBellsConditions, 'validateFulfillment')
    test.end()
  })

  conditionsTest.afterEach(test => {
    sandbox.restore()
    test.end()
  })

  conditionsTest.test('validateCondition should', validateConditionTest => {
    validateConditionTest.test('throw error if five-bell check throws error', test => {
      let condition = 'some-condition'
      let error = new Error('message')
      FiveBellsConditions.validateCondition.withArgs(condition).throws(error)
      try {
        Conditions.validateCondition(condition)
        test.fail('Should have thrown')
      } catch (error) {
        test.assert(error instanceof ValidationError)
        test.equal(error.message, 'message')
        test.end()
      }
    })

    validateConditionTest.test('return true if five-bell condition returns true', test => {
      let condition = 'some-condition'
      FiveBellsConditions.validateCondition.withArgs(condition).returns(true)
      test.equal(Conditions.validateCondition(condition), true)
      test.end()
    })
    validateConditionTest.end()
  })

  conditionsTest.test('validateFulfillment should', validateFulfillmentTest => {
    validateFulfillmentTest.test('throw error if five-bell check throws error', test => {
      let condition = 'some-condition'
      let fulfillment = 'some-fulfillment'
      let error = new Error('message')
      FiveBellsConditions.validateFulfillment.withArgs(fulfillment, condition).throws(error)
      try {
        Conditions.validateFulfillment(fulfillment, condition)
        test.fail('Should have thrown')
      } catch (error) {
        test.assert(error instanceof ValidationError)
        test.equal(error.message, 'message')
        test.end()
      }
    })

    validateFulfillmentTest.test('return true if five-bell fulfillment returns true', test => {
      let condition = 'some-condition'
      let fulfillment = 'some-fulfillment'
      FiveBellsConditions.validateFulfillment.withArgs(fulfillment, condition).returns(true)
      test.equal(Conditions.validateFulfillment(fulfillment, condition), true)
      test.end()
    })

    validateFulfillmentTest.end()
  })
  conditionsTest.end()
})
