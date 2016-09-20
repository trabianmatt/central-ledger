'use strict'

module.exports = {
  PrepareTransfer ({
    id,
      ledger,
      debits,
      credits,
      execution_condition,
      expires_at
    }) {
    return this.$aggregate.create('Transfer', {
      ledger,
      debits,
      credits,
      execution_condition,
      expires_at
    })
                        .then(
                        transfer => {
                          transfer.$setId(id)
                          transfer.$save()
                        })
  },

  FulfillTransfer ({
      id, fulfillment
    }) {
    return this.$aggregate.load('Transfer', id)
      .then(function (transfer) {
        transfer.fulfill({fulfillment})
        transfer.$save()
      })
  }
}
