# Central Ledger Documentation
***

In this guide, we'll walk through the different central ledger endpoints:
* `POST` [**Create account**](#create-account)
* `GET` [**Get account**](#get-account)
* `PUT` [**Prepare transfer**](#prepare-transfer) 
* `PUT` [**Fulfill transfer**](#fulfill-transfer)
* `PUT` [**Reject transfer**](#reject-transfer) 
* `GET` [**Get transfer by id**](#get-transfer-by-id)
* `GET` [**Get transfer fulfillment**](#get-transfer-fulfillment)
* `GET` [**Get net positions**](#get-net-positions) 
* `GET` [**Get metadata**](#get-metadata) 
* `POST` [**Settle fulfilled transfers**](#settle-all-currently-fulfilled-transfers) 
* `POST` [**Get charge quote**](#get-charge-quote) 

The different endpoints often deal with these [data structures](#data-structures): 
* [**Transfer Object**](#transfer-object)
* [**Account Object**](#account-object)
* [**Notification Object**](#notification-object)
* [**Metadata Object**](#metadata-object)
* [**Position Object**](#position-object)

Information about various errors returned can be found here:
* [**Error Information**](#error-information)

### Introduction
The Central Ledger offers a series of services to facilitate transfer information for participants. The information collected in the transfer process is leveraged for clearing funds to end users, calculating net positons, and performing net settlements. In this guide, we’ll walk through the various steps of completing a transfer.
***

## Endpoints

#### Create account
The create account endpoint will create an account in the ledger.

##### HTTP Request
`POST http://central-ledger/accounts`

##### Headers
| Field | Type | Description |
| ----- | ---- | ----------- |
| Content-Type | String | Must be set to `application/json` |

##### Request Body
| Field | Type | Description |
| ----- | ---- | ----------- |
| Object | Account | An [Account object](#account-object) to create |

##### Response 201 Created
| Field | Type | Description |
| ----- | ---- | ----------- |
| Object | Account | The newly-created [Account object](#account-object) as saved |

##### Request
``` http
POST http://central-ledger/accounts HTTP/1.1
Content-Type: application/json
{
  "name": "dfsp1",
  "password": "dfsp1_password"
}
```

##### Response
``` http
HTTP/1.1 201 CREATED
Content-Type: application/json
{
  "id": "http://central-ledger/accounts/dfsp1",
  "name": "dfsp1",
  "created": "2017-01-03T19:50:39.744Z",
  "balance": "0",
  "is_disabled": false,
  "ledger": "http://central-ledger"
}
```

##### Errors (4xx)
| Field | Description |
| ----- | ----------- |
| RecordExistsError | The account already exists (determined by name) |

``` http
{
  "id": "RecordExistsError",
  "message": "The account has already been registered"
}
```

#### Get account
The get account endpoint will return information about the account. To successfully retrieve an account, make sure the [account has been previously created.](#create-account)

##### HTTP Request
`GET http://central-ledger/accounts/dfsp1`

##### URL Params
| Field | Type | Description |
| ----- | ---- | ----------- |
| name | String | The unique name for the account |

##### Response 200 OK
| Field | Type | Description |
| ----- | ---- | ----------- |
| Object | Account | The [Account object](#account-object) as saved |

##### Request
``` http
  GET http://central-ledger/accounts/dfsp1 HTTP/1.1
```

##### Response
``` http
  HTTP/1.1 200 OK
  Content-Type: application/json
  {
    "id": "http://central-ledger/accounts/dfsp1",
    "name": "dfsp1",
    "created": "2016-09-28T17:03:37.168Z",
    "balance": 1000000,
    "is_disabled": false,
    "ledger": "http://central-ledger"
  }
```

##### Errors (4xx)
| Field | Description |
| ----- | ----------- |
| NotFoundError | The requested resource could not be found |
``` http
{
  "id": "NotFoundError",
  "message": "The requested resource could not be found."
}
```

#### Prepare transfer
The prepare transfer endpoint will create or update a transfer object. A transfer between two DFSPs must be prepared before it can be fulfilled. Before you can successfully prepare a transfer, make sure you have [created the corresponding accounts](#create-account).

##### HTTP Request
`PUT http://central-ledger/transfers/2d4f2a70-e0d6-42dc-9efb-6d23060ccd6f`

##### Headers
| Field | Type | Description |
| ----- | ---- | ----------- |
| Content-Type | String | Must be set to `application/json` |

##### URL Params
| Field | Type | Description |
| ----- | ---- | ----------- |
| id | String | A new UUID to identify this transfer |

##### Request body
| Field | Type | Description |
| ----- | ---- | ----------- |
| Object | Transfer | A [Transfer object](#transfer-object) to describe the transfer that should take place. For a conditional transfer, this includes an execution_condition |

##### Response 201 Created
| Field | Type | Description |
| ----- | ---- | ----------- |
| Object | Transfer | The newly-created [Transfer object](#transfer-object) as saved |

##### Response 200 OK
| Field | Type | Description |
| ----- | ---- | ----------- |
| Object | Transfer | The updated [Transfer object](#transfer-object) as saved |

##### Request
``` http
PUT http://central-ledger/transfers/2d4f2a70-e0d6-42dc-9efb-6d23060ccd6f HTTP/1.1
Content-Type: application/json
{
    "id": "http://central-ledger/transfers/2d4f2a70-e0d6-42dc-9efb-6d23060ccd6f",
    "ledger": "http://central-ledger",
    "debits": [{
      "account": "http://central-ledger/accounts/dfsp1",
      "amount": "50"
    }],
    "credits": [{
      "account": "http://central-ledger/accounts/dfsp2",
      "amount": "50"
    }],
    "execution_condition": "ni:///sha-256;47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU?fpt=preimage-sha-256&cost=0",
    "expires_at": "2016-12-26T00:00:01.000Z"
  }
```

##### Response
``` http
HTTP/1.1 201 CREATED
Content-Type: application/json
{
  "id": "http://central-ledger/transfers/2d4f2a70-e0d6-42dc-9efb-6d23060ccd6f",
  "ledger": "http://central-ledger",
  "debits": [
    {
      "account": "http://central-ledger/accounts/dfsp1",
      "amount": 50
    }
  ],
  "credits": [
    {
      "account": "http://central-ledger/accounts/dfsp2",
      "amount": 50
    }
  ],
  "execution_condition": "ni:///sha-256;47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU?fpt=preimage-sha-256&cost=0",
  "expires_at": "2016-12-26T00:00:01.000Z",
  "state": "prepared",
  "timeline": {
    "prepared_at": "2017-01-03T16:16:18.958Z"
  }
}
```

##### Errors (4xx)
| Field | Description |
| ----- | ----------- |
| UnprocessableEntityError | The provided entity is syntactically correct, but there is a generic semantic problem with it | 
``` http
{
  "id": "UnprocessableEntityError",
  "message": "The provided entity is syntactically correct, but there is a generic semantic problem with it"
}
```

#### Fulfill transfer 
The fulfill transfer endpoint will either execute or cancel a transfer, depending on the existence of an *execution_condition* or *cancellation_condition*. To successfully fulfill a transfer, make sure the [transfer has previously been prepared.](#prepare-transfer) 

##### HTTP Request
`PUT http://central-ledger/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204/fulfillment`

##### Headers
| Field | Type | Description |
| ----- | ---- | ----------- |
| Content-Type | String | Must be set to `text/plain` |

##### URL Params
| Field | Type | Description |
| ----- | ---- | ----------- |
| id | String | Transfer UUID |

##### Request Body
| Field | Type | Description |
| ----- | ---- | ----------- |
| Fulfillment | String | A fulfillment in string format |

##### Response 200 OK
| Field | Type | Description |
| ----- | ---- | ----------- |
| Fulfillment | String | The fulfillment that was sent |

##### Request
``` http
PUT http://central-ledger/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204/fulfillment HTTP/1.1
Content-Type: text/plain
oAKAAA
```

##### Response
``` http
HTTP/1.1 201 OK
Content-Type: application/json
{
  "id": "http://central-ledger/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204",
  "ledger": "http://central-ledger",
  "debits": [
    {
      "memo": {
        "path": "blah",
        "interledger": "blah"
      },
      "amount": 50,
      "account": "http://central-ledger/accounts/dfsp1"
    }
  ],
  "credits": [
    {
      "memo": {
        "path": "blah",
        "interledger": "blah"
      },
      "amount": 50,
      "account": "http://central-ledger/accounts/dfsp2"
    }
  ],
  "execution_condition": "ni:///sha-256;47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU?fpt=preimage-sha-256&cost=0",
  "expires_at": "2016-12-26T00:00:01.000Z",
  "state": "executed",
  "timeline": {
    "prepared_at": "2016-12-19T16:04:01.316Z",
    "executed_at": "2016-12-19T16:04:55.766Z"
  }
}
```

##### Errors (4xx)
| Field | Description |
| ----- | ----------- |
| UnprocessableEntityError | The provided entity is syntactically correct, but there is a generic semantic problem with it |
| NotFoundError | The requested resource could not be found |
``` http
{
  "id": "NotFoundError",
  "message": "The requested resource could not be found."
}
```

#### Reject transfer
The reject transfer endpoint rejects the transfer with the given message. To successfully reject a transfer, make sure the [transfer has previously been prepared.](#prepare-transfer)

##### HTTP Request
`PUT http://central-ledger/transfers/7d4f2a70-e0d6-42dc-9efb-6d23060ccd6f/rejection`

##### URL Params
| Field | Type | Description |
| ----- | ---- | ----------- |
| id | String | Transfer UUID |

##### Response 200 OK
| Field | Type | Description |
| ----- | ---- | ----------- |
| Rejection | String | An error message in string format |

##### Request
``` http
PUT http://central-ledger/transfers/7d4f2a70-e0d6-42dc-9efb-6d23060ccd6f/rejection HTTP/1.1
Content-Type: text/plain
this transfer is bad
```

##### Response
``` http
HTTP/1.1 200 OK
{
  "id": "http://central-ledger/transfers/7d4f2a70-e0d6-42dc-9efb-6d23060ccd6f",
  "ledger": "http://central-ledger",
  "debits": [
    {
      "memo": {
        "path": "blah",
        "interledger": "blah"
      },
      "amount": 50,
      "account": "http://central-ledger/accounts/dfsp1"
    }
  ],
  "credits": [
    {
      "memo": {
        "path": "blah",
        "interledger": "blah"
      },
      "amount": 50,
      "account": "http://central-ledger/accounts/dfsp2"
    }
  ],
  "execution_condition": "ni:///sha-256;47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU?fpt=preimage-sha-256&cost=0",
  "expires_at": "2016-12-26T00:00:01.000Z",
  "state": "rejected",
  "timeline": {
    "prepared_at": "2017-01-03T16:16:18.958Z",
    "rejected_at": "2017-01-03T19:58:42.100Z"
  },
  "rejection_reason": "this transfer is bad"
}
```

##### Errors (4xx)
| Field | Description |
| ----- | ----------- |
| NotFoundError | The requested resource could not be found |
``` http
{
  "id": "UnpreparedTransferError",
  "message": "The provided entity is syntactically correct, but there is a generic semantic problem with it."
}
```

#### Get transfer by id

##### HTTP Request
`GET http://central-ledger/transfers/2d4f2a70-e0d6-42dc-9efb-6d23060ccd6f`

##### URL Params
| Field | Type | Description |
| ----- | ---- | ----------- |
| id | String | Transfer UUID |

##### Response 200 OK
| Field | Type | Description |
| ----- | ---- | ----------- |
| Object | Transfer | The [Transfer object](#transfer-object) as saved |

##### Request
``` http
GET http://central-ledger/transfers/2d4f2a70-e0d6-42dc-9efb-6d23060ccd6fHTTP/1.1
```

##### Response
``` http
HTTP/1.1 200 OK
{
  "id": "http://central-ledger/transfers/2d4f2a70-e0d6-42dc-9efb-6d23060ccd6f",
  "ledger": "http://central-ledger",
  "debits": [
    {
      "account": "http://central-ledger/accounts/dfsp1",
      "amount": "50.00",
      "memo": "{\"path\":\"blah\",\"interledger\":\"blah\"}"
    }
  ],
  "credits": [
    {
      "account": "http://central-ledger/accounts/dfsp2",
      "amount": "50.00",
      "memo": "{\"path\":\"blah\",\"interledger\":\"blah\"}"
    }
  ],
  "execution_condition": "ni:///sha-256;47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU?fpt=preimage-sha-256&cost=0",
  "expires_at": "2016-12-26T00:00:01.000Z",
  "state": "executed",
  "timeline": {
    "prepared_at": "2016-12-19T16:04:01.316Z",
    "executed_at": "2016-12-19T16:04:55.766Z"
  },
  "rejection_reason": null
}
```

##### Errors (4xx)
| Field | Description |
| ----- | ----------- |
| NotFoundError | The requested resource could not be found |
``` http
{
  "id": "NotFoundError",
  "message": "The requested resource could not be found."
}
```

#### Get transfer fulfillment
The get transfer fulfillment endpoint will return the fulfillment for a transfer that has been executed or cancelled. To successfully retrieve a transfer fulfillment, make sure the [transfer has previously been fulfilled.](#fulfill-transfer)

##### HTTP Request
`GET http://central-ledger/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204/fulfillment`

##### URL Params
| Field | Type | Description |
| ----- | ---- | ----------- |
| id | String | Transfer UUID |

##### Response 200 OK
| Field | Type | Description |
| ----- | ---- | ----------- |
| Fulfillment | String | The fulfillment for the transfer |

#### Request
``` http
GET http://central-ledger/transfers/3a2a1d9e-8640-4d2d-b06c-84f2cd613204/fulfillment HTTP/1.1
```

##### Response
``` http
HTTP/1.1 200 OK
oAKAAA
```

##### Errors (4xx)
| Field | Description |
| ----- | ----------- |
| NotFoundError | The requested resource could not be found |
``` http
{
  "id": "NotFoundError",
  "message": "The requested resource could not be found."
}
```

#### Get net positions
The get current net positions endpoint returns the current net positions for all accounts in the ledger.

##### HTTP Request
`GET http://central-ledger/positions`

##### Response 200 OK
| Field | Type | Description |
| ----- | ---- | ----------- |
| Positions | Array | List of current [Position objects](#position-object) for the ledger |

#### Request
``` http
GET http://central-ledger/positions HTTP/1.1
```

##### Response
``` http
HTTP/1.1 200 OK
{
  "positions": [
    {
      "account": "http://central-ledger/accounts/dfsp1",
      "payments": "0",
      "receipts": "0",
      "net": "0"
    },
    {
      "account": "http://central-ledger/accounts/dfsp2",
      "payments": "100",
      "receipts": "0",
      "net": "-100"
    },
    {
      "account": "http://central-ledger/accounts/dfsp3",
      "payments": "0",
      "receipts": "100",
      "net": "100"
    }
  ]
}
```

#### Get net positions for account
The get current net positions endpoint returns the current net positions for all accounts in the ledger.

##### HTTP Request
`GET http://central-ledger/positions/dfsp1`

##### Response 200 OK
| Field | Type | Description |
| ----- | ---- | ----------- |
| Object | Array | [Position objects](#position-object) for the account |

#### Request
``` http
GET http://central-ledger/positions/dfsp1 HTTP/1.1
```

##### Response
``` http
HTTP/1.1 200 OK
{
  "account": "http://localhost:3000/accounts/dfsp1",
  "fees": {
    "payments": "4",
    "receipts": "0",
    "net": "-4"
  },
  "transfers": {
    "payments": "40",
    "receipts": "0",
    "net": "-40"
  },
  "net": "-44"
}
```

##### Errors (4xx)
| Field | Description |
| ----- | ----------- |
| NotFoundError | The requested resource could not be found |
``` http
{
  "id": "NotFoundError",
  "message": "The requested resource could not be found."
}
```

#### Get metadata
The get metada endpoint returns metadata associated with the ledger.

##### HTTP Request
`GET http://central-ledger`

##### Response 200 OK
| Field | Type | Description |
| ----- | ---- | ----------- |
| Metadata | Object | The [Metadata object](#metadata-object) for the ledger |

##### Request
``` http
GET http://central-ledger HTTP/1.1
```

##### Response
``` http
HTTP/1.1 200 OK
{
  "currency_code": null,
  "currency_symbol": null,
  "ledger": "http://central-ledger",
  "urls": {
    "auth_token": "http://central-ledger/auth_token",
    "health": "http://central-ledger/health",
    "positions": "http://central-ledger/positions",
    "account": "http://central-ledger/accounts/:name",
    "accounts": "http://central-ledger/accounts",
    "send_message": "http://central-ledger/messages",
    "transfer": "http://central-ledger/transfers/:id",
    "transfer_fulfillment": "http://central-ledger/transfers/:id/fulfillment",
    "transfer_rejection": "http://central-ledger/transfers/:id/rejection",
    "notifications": "ws://central-ledger/websocket"
  },
  "precision": 10,
  "scale": 2
}
```

#### Settle all currently fulfilled transfers
Settle all currently fulfilled transfers in the ledger

##### HTTP Request
`POST http://central-ledger/webhooks/settle-transfers HTTP/1.1`

##### Response 200 OK
| Field | Type | Description |
| ----- | ---- | ----------- |
| N/A | Array | List of transfer ids settled for the ledger |

##### Request
``` http
POST http://central-ledger/webhooks/settle-transfers HTTP/1.1
```

##### Response
``` http
HTTP/1.1 200 OK
["3a2a1d9e-8640-4d2d-b06c-84f2cd613207", "7e10238b-4e39-49a4-93dc-c8f73afc1717"]
```

#### Get a charge quote
Get a list of charge quotes for a given amount, that the sender would be responsible for paying

##### HTTP Request
`POST http://central-ledger/charges/quote`

##### Headers
| Field | Type | Description |
| ----- | ---- | ----------- |
| Content-Type | String | Must be set to `application/json` |

##### Request Body
| Field | Type | Description |
| ----- | ---- | ----------- |
| Amount | Decimal | The amount for quote |

##### Response 200 OK
| Field | Type | Description |
| ----- | ---- | ----------- |
| N/A | Array | A list of charge quotes |

##### Request
``` http
POST http://central-ledger/charges/quotes HTTP/1.1
Content-Type: application/json
{
  "amount": "10.00"
}
```

##### Response
``` http
HTTP/1.1 200 OK
Content-Type: application/json
[
  {
    "name": "charge1",
    "charge_type": "tax",
    "code": "001",
    "amount": "0.25",
    "currency_code": "USD",
    "currency_symbol": "$"
  },
  {
    "name": "charge2",
    "charge_type": "tax",
    "code": "002",
    "amount": "2.00",
    "currency_code": "USD",
    "currency_symbol": "$"
  }
]
```

##### Errors (4xx)
| Field | Description |
| ----- | ----------- |
| InvalidBodyError | Body does not match schema |

``` http
{
  "id": "InvalidBodyError",
  "message": "Body does not match schema"
}
```

***

## Data Structures

### Transfer Object

A transfer represents money being moved between two DFSP accounts at the central ledger.

The transfer must specify an execution_condition, in which case it executes automatically when presented with the fulfillment for the condition. (Assuming the transfer has not expired or been canceled first.) Currently, the central ledger only supports the condition type of [PREIMAGE-SHA-256](https://interledger.org/five-bells-condition/spec.html#rfc.section.4.1) and a max fulfillment length of 65535. 

Some fields are Read-only, meaning they are set by the API and cannot be modified by clients. A transfer object can have the following fields:

| Name | Type | Description |
| ---- | ---- | ----------- |
| id   | URI | Resource identifier |
| ledger | URI | The ledger where the transfer will take place |
| debits | Array | Funds that go into the transfer |
| debits[].account | URI | Account holding the funds |
| debits[].amount | String | Amount as decimal |
| debits[].invoice | URI | *Optional* Unique invoice URI |
| debits[].memo | Object | *Optional* Additional information related to the debit |
| debits[].authorized | Boolean | *Optional* Indicates whether the debit has been authorized by the required account holder |
| debits[].rejected | Boolean | *Optional* Indicates whether debit has been rejected by account holder |
| debits[].rejection_message | String | *Optional* Reason the debit was rejected |
| credits | Array | Funds that come out of the transfer |
| credits[].account | URI | Account receiving the funds |
| credits[].amount | String | Amount as decimal |
| credits[].invoice | URI | *Optional* Unique invoice URI |
| credits[].memo | Object | *Optional* Additional information related to the credit |
| credits[].authorized | Boolean | *Optional* Indicates whether the credit has been authorized by the required account holder |
| credits[].rejected | Boolean | *Optional* Indicates whether credit has been rejected by account holder |
| credits[].rejection_message | String | *Optional* Reason the credit was rejected |
| execution_condition | String | The condition for executing the transfer | 
| expires_at | DateTime | Time when the transfer expires. If the transfer has not executed by this time, the transfer is canceled. |
| state | String | *Optional, Read-only* The current state of the transfer (informational only) |
| timeline | Object | *Optional, Read-only* Timeline of the transfer's state transitions |
| timeline.prepared_at | DateTime | *Optional* An informational field added by the ledger to indicate when the transfer was originally prepared |
| timeline.executed_at | DateTime | *Optional* An informational field added by the ledger to indicate when the transfer was originally executed |

### Account Object

An account represents a DFSP's position at the central ledger.

Some fields are Read-only, meaning they are set by the API and cannot be modified by clients. An account object can have the following fields:

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | URI | *Read-only* Resource identifier |
| name | String | Unique name of the account |
| password | String | Password for the account |
| balance | String | *Optional, Read-only* Balance as decimal |
| is_disabled | Boolean | *Optional, Read-only* Admin users may disable/enable an account |
| ledger | URI | *Optional, Read-only* A link to the account's ledger |
| created | DateTime | *Optional, Read-only* Time when account was created |

### Notification Object

The central ledger pushes a notification object to WebSocket clients when a transfer changes state. This notification is sent at most once for each state change. 

A notification object can have the following fields:

| Name | Type | Description |
| ---- | ---- | ----------- |
| resource | Object | [Transfer object](#transfer-object) that is the subject of the notification |
| related_resources | Object | *Optional* Additional resources relevant to the event |
| related\_resources.execution\_condition_fulfillment | String | *Optional* Proof of condition completion |
| related\_resources.cancellation\_condition_fulfillment | String | *Optional* Proof of condition completion |

### Metadata Object

The central ledger will return a metadata object about itself allowing client's to configure themselves properly.

A metadata object can have the following fields:

| Name | Type | Description |
| ---- | ---- | ----------- |
| currency_code | String | Three-letter ([ISO 4217](http://www.xe.com/iso4217.php)) code of the currency this ledger tracks |
| currency_symbol | String | Currency symbol to use in user interfaces for the currency represented in this ledger. For example, "$" |
| ledger | URI | The ledger that generated the metadata |
| urls | Object | Paths to other methods exposed by this ledger. Each field name is short name for a method and the value is the path to that method. |
| precision | Integer | How many total decimal digits of precision this ledger uses to represent currency amounts |
| scale | Integer | How many digits after the decimal place this ledger supports in currency amounts |

### Position Object

The central ledger can report the current positions for all registered accounts.

A position object can have the following fields:

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | URI | A link to the account for the calculated position |
| payments | String | Total non-settled amount the account has paid as string |
| receipts | String | Total non-settled amount the account has received as string |
| net | String | Net non-settled amount for the account as string |

***

## Error Information

This section identifies the potential errors returned and the structure of the response.

An error object can have the following fields:

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | String | An identifier for the type of error |
| message | String | A message describing the error that occurred |
| validationErrors | Array | *Optional* An array of validation errors |
| validationErrors[].message | String | A message describing the validation error |
| validationErrors[].params | Object | An object containing the field that caused the validation error |
| validationErrors[].params.key | String | The name of the field that caused the validation error |
| validationErrors[].params.value | String | The value that caused the validation error |
| validationErrors[].params.child | String | The name of the child field |

``` http
HTTP/1.1 404 Not Found
Content-Type: application/json
{
  "id": "InvalidUriParameterError",
  "message": "Error validating one or more uri parameters",
  "validationErrors": [
    {
      "message": "id must be a valid GUID",
      "params": {
        "value": "7d4f2a70-e0d6-42dc-9efb-6d23060ccd6",
        "key": "id"
      }
    }
  ]
}
```
