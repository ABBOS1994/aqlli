// helpers/atmosTokenManager.js
const axios = require('axios')
const qs = require('qs')

let cachedToken = null
let tokenExpireTime = null

async function getToken() {
  if (cachedToken && Date.now() < tokenExpireTime) return cachedToken

  const basicAuth = Buffer.from(
    `${process.env.ATMOS_CONSUMER_KEY}:${process.env.ATMOS_CONSUMER_SECRET}`
  ).toString('base64')

  const res = await axios.post(
    'https://partner.atmos.uz/token',
    qs.stringify({ grant_type: 'client_credentials' }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`
      }
    }
  )

  cachedToken = res.data.access_token
  tokenExpireTime = Date.now() + res.data.expires_in * 1000
  return cachedToken
}

module.exports = { getToken }
