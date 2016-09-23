'use strict'

const Handler = require('../../../../src/api/metadata/handler')
const Test = require('tape')
const apiTags = ['api']

function createRequest (routes) {
  return {
    server: {
      table: () => [
        {
          table: routes || []
        }
      ]
    }
  }
}

Test('metadata handler', (handlerTest) => {
  handlerTest.test('health should', (healthTest) => {
    healthTest.test('return status ok', (assert) => {
      let reply = function (response) {
        assert.equal(response.status, 'OK')
        return {
          code: (statusCode) => {
            assert.equal(statusCode, 200)
            assert.end()
          }
        }
      }

      Handler.health(createRequest(), reply)
    })
    healthTest.end()
  })

  handlerTest.test('metadata should', function (metadataTest) {
    metadataTest.test('return 200 httpStatus', (t) => {
      let reply = (response) => {
        return {
          code: statusCode => {
            t.equal(statusCode, 200)
            t.end()
          }
        }
      }

      Handler.metadata(createRequest(), reply)
    })

    metadataTest.test('return default values', t => {
      let reply = response => {
        t.equal(response.currency_code, null)
        t.equal(response.currency_symbol, null)
        t.equal(response.precision, 10)
        t.equal(response.scale, 2)
        return { code: statusCode => { t.end() } }
      }

      Handler.metadata(createRequest(), reply)
    })

    metadataTest.test('return urls from request.server', t => {
      let request = createRequest([
        { settings: { id: 'first_route', tags: apiTags }, path: '/' }
      ])

      let reply = response => {
        t.equal(response.urls['first_route'], '/')
        return { code: statusCode => { t.end() } }
      }

      Handler.metadata(request, reply)
    })

    metadataTest.test('only return urls with id', t => {
      let request = createRequest([
        { settings: { tags: apiTags }, path: '/' },
        { settings: { id: 'expected', tags: apiTags }, path: '/expected' }
      ])

      let reply = response => {
        t.equal(Object.keys(response.urls).length, 1)
        t.equal(response.urls['expected'], '/expected')
        return { code: statusCode => { t.end() } }
      }

      Handler.metadata(request, reply)
    })

    metadataTest.test('only return urls tagged with api', t => {
      let request = createRequest([
        { settings: { id: 'nottagged' }, path: '/nottagged' },
        { settings: { id: 'tagged', tags: apiTags }, path: '/tagged' },
        { settings: { id: 'wrongtag', tags: ['notapi'] }, path: '/wrongtag' }
      ])

      let reply = response => {
        t.equal(Object.keys(response.urls).length, 1)
        t.equal(response.urls['tagged'], '/tagged')
        t.notOk(response.urls['nottagged'])
        return { code: statusCode => { t.end() } }
      }

      Handler.metadata(request, reply)
    })

    metadataTest.test('format url parameters with colons', t => {
      let request = createRequest([
        { settings: { id: 'path', tags: apiTags }, path: '/somepath/{id}' },
        { settings: { id: 'manyargs', tags: apiTags }, path: '/somepath/{id}/{path*}/{test2}/' }
      ])

      let reply = response => {
        t.equal(response.urls['path'], '/somepath/:id')
        t.equal(response.urls['manyargs'], '/somepath/:id/:path*/:test2/')
        return { code: statusCode => { t.end() } }
      }

      Handler.metadata(request, reply)
    })

    metadataTest.end()
  })

  handlerTest.end()
})
