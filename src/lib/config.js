const RC = require('rc')('CLEDG', require('../../config/default.json'))

module.exports = {
  HOSTNAME: RC.HOSTNAME.replace(/\/$/, ''),
  PORT: RC.PORT,
  DATABASE_URI: RC.DATABASE_URI,
  AMOUNT: RC.AMOUNT,
  ENABLE_TOKEN_AUTH: RC.ENABLE_TOKEN_AUTH,
  ADMIN_SECRET: RC.ADMIN_SECRET,
  ADMIN_KEY: RC.ADMIN_KEY
}
