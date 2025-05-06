// helpers/atmosCard.js
const axios = require('axios')
const { getToken } = require('./atmosTokenManager')

const BASE_URL = 'https://partner.atmos.uz'

// 1. Init card binding
async function bindCardInit(card_number, expiry) {
  const token = await getToken()
  const response = await axios.post(`${BASE_URL}/partner/bind-card/init`, {
    card_number,
    expiry
  }, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  return response.data
}

// 2. Confirm card binding
async function bindCardConfirm(transaction_id, otp) {
  const token = await getToken()
  const response = await axios.post(`${BASE_URL}/partner/bind-card/confirm`, {
    transaction_id,
    otp
  }, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  return response.data
}

// 3. Request voice call
async function bindCardDial(transaction_id) {
  const token = await getToken()
  const response = await axios.put(`${BASE_URL}/partner/bind-card/dial`, {
    transaction_id
  }, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  return response.data
}

// 4. Get list of bound cards
async function getBoundCards(page = 1, page_size = 10) {
  const token = await getToken()
  const response = await axios.post(`${BASE_URL}/partner/list-cards`, {
    page,
    page_size
  }, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  return response.data
}

// 5. Remove a bound card
async function removeCard(id, tokenValue) {
  const token = await getToken()
  const response = await axios.post(`${BASE_URL}/partner/remove-card`, {
    id,
    token: tokenValue
  }, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  return response.data
}

module.exports = {
  bindCardInit,
  bindCardConfirm,
  bindCardDial,
  getBoundCards,
  removeCard
}
