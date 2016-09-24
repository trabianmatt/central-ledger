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
                          transfer.$setIdForCreation(id)
                          return transfer.$save()
                        })
  },

  FulfillTransfer ({
      id, fulfillment
    }) {
    return this.$aggregate.load('Transfer', id)
      .then(transfer => {
        transfer.fulfill({fulfillment})
        return transfer.$save()
      })
  }
}
