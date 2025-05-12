// helpers/atmosPayment.js
const axios = require('axios')
const { getToken } = require('./atmosTokenManager')
const User = require('../models/user')

const BASE_URL = 'https://partner.atmos.uz'

const createTransaction = async (userId, amount) => {
  const token = await getToken()
  try {
    const res = await axios.post(
      `${BASE_URL}/merchant/pay/create`,
      {
        amount,
        account: userId,
        store_id: parseInt(process.env.ATMOS_STORE_ID),
        terminal_id: process.env.ATMOS_TERMINAL_ID,
        lang: 'uz'
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )
    return res.data
  } catch (err) {
    console.error('❌ Tranzaksiyani yaratishda xatolik:', err.response?.data || err.message)
    return null
  }
}


const confirmPayment = async ({ transaction_id, otp }) => {
  const token = await getToken()
  try {
    const res = await axios.post(
      `${BASE_URL}/merchant/pay/apply`,
      {
        transaction_id,
        otp,
        store_id: parseInt(process.env.ATMOS_STORE_ID)
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return res.data
  } catch (err) {
    console.error('❌ To‘lovni tasdiqlashda xatolik:', err.response?.data || err.message)
    return null
  }
}

module.exports = {
  createTransaction,
  confirmPayment
}
