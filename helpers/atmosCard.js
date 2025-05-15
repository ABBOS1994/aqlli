// helpers/atmosCard.js
const axios = require('axios')
const { getToken } = require('./atmosTokenManager')

const BASE_URL = 'https://partner.atmos.uz'

const removeCard = async ({ id, token }) => {
  const bearer = await getToken()
  const payload = { id, token }

  const headers = {
    Authorization: `Bearer ${bearer}`,
    'Content-Type': 'application/json'
  }

  try {
    const res = await axios.post(`${BASE_URL}/partner/remove-card`, payload, {
      headers
    })
    return res.data
  } catch (err) {
    console.error('❌ removeCard error:', err.response?.data || err.message)
    throw err
  }
}

module.exports = { removeCard }
