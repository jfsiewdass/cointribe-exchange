const { createClient } = require('redis');
const appRoot = require('app-root-path');
require('dotenv').config({ path: `${appRoot}/config/.env` })


module.exports = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});
