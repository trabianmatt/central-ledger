'use strict'

const Test = require('tape')
const Handler = require('../../../src/lib/handler')

Test('handler test', handlerTest => {
  handlerTest.test('putResponse should', putResponseTest => {
    putResponseTest.test('reply with entity status 201 if entity not existing', test => {
      let entity = {}

      let reply = (response) => {
        test.equal(response, entity)
        return {
          code: statusCode => {
            test.equal(statusCode, 201)
            test.end()
          }
        }
      }

      Handler.putResponse(reply, x => x)(entity)
    })

    putResponseTest.test('reply with entity status 200 if entity existing', test => {
      let entity = { existing: true }

      let reply = (response) => {
        test.equal(response, entity)
        return {
          code: statusCode => {
            test.equal(statusCode, 200)
            test.end()
          }
        }
      }

      Handler.putResponse(reply, x => x)(entity)
    })

    putResponseTest.end()
  })

  handlerTest.test('badRequest should', badRequestTest => {
    badRequestTest.test('return default values if error does not provide them', test => {
      let error = new Error()

      let reply = (response) => {
        return {
          code: statusCode => {
            test.equal(response.id, 'InvalidBodyError')
            test.equal(response.message, 'The submitted JSON entity does not match the required schema.')
            test.equal(statusCode, 400)
            test.end()
          }
        }
      }

      Handler.badRequest(reply)(error)
    })

    badRequestTest.test('return validation errors if error defines them', test => {
      let validationErrors = ['error1', 'error2']
      let error = {
        validationErrors: validationErrors
      }

      let reply = (response) => {
        return {
          code: statusCode => {
            test.equal(response.validationErrors, validationErrors)
            test.equal(statusCode, 400)
            test.end()
          }
        }
      }

      Handler.badRequest(reply)(error)
    })

    badRequestTest.end()
  })

  handlerTest.test('notFound should', notFoundTest => {
    notFoundTest.test('return default values', test => {
      let error = {}
      let reply = (response) => {
        return {
          code: statusCode => {
            test.equal(response.id, 'NotFoundError')
            test.equal(response.message, 'The requested resource could not be found.')
            test.equal(statusCode, 404)
            test.end()
          }
        }
      }

      Handler.notFound(reply)(error)
    })

    notFoundTest.end()
  })

  handlerTest.test('unprocessableEntity should', unprocessableEntityTest => {
    unprocessableEntityTest.test('return default values', test => {
      let error = {}

      let reply = (response) => {
        return {
          code: statusCode => {
            test.equal(response.id, 'UnprocessableEntityError')
            test.equal(response.message, 'The provided entity is syntactically correct, but there is a generic semantic problem with it.')
            test.equal(statusCode, 422)
            test.end()
          }
        }
      }

      Handler.unprocessableEntity(reply)(error)
    })
    unprocessableEntityTest.end()
  })

  handlerTest.end()
})
