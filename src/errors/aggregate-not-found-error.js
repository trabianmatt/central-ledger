module.exports = (e) => {
  let message = e.originalErrorMessage || e.message
  return (message && message.includes('No domainEvents for aggregate of type Transfer'))
}
