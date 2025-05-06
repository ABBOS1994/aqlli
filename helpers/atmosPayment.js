// helpers/atmosPayment.js
const axios = require('axios')
const { getToken } = require('./atmosTokenManager')
const User = require('../models/user')

const BASE_URL = 'https://partner.atmos.uz'

// 💳 1. Kartani bog'lash (init)
const initCardBinding = async ({ card_number, expiry }) => {
  const token = await getToken()
  try {
    const res = await axios.post(
      `${BASE_URL}/partner/bind-card/init`,
      { card_number, expiry },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return res.data
  } catch (err) {
    console.error('❌ Kartani bog‘lashda xatolik:', err.response?.data || err.message)
    return null
  }
}

// 💳 2. SMS orqali kartani tasdiqlash (confirm)
const confirmCardBinding = async ({ transaction_id, otp, userId }) => {
  const token = await getToken()
  try {
    const res = await axios.post(
      `${BASE_URL}/partner/bind-card/confirm`,
      { transaction_id, otp },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    const card_token = res.data?.data?.card_token
    if (card_token && userId) {
      await User.updateOne({ id: userId }, { $set: { card_token } })
    }
    return res.data
  } catch (err) {
    console.error('❌ Kartani tasdiqlashda xatolik:', err.response?.data || err.message)
    return null
  }
}

// 🧾 3. Tranzaksiya yaratish
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
        lang: 'ru'
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

// 🔐 4. Pre-confirm bosqichi
const preConfirmTransaction = async ({ transaction_id, card_token }) => {
  const token = await getToken()
  try {
    const res = await axios.post(
      `${BASE_URL}/merchant/pay/pre-apply`,
      {
        transaction_id,
        card_token,
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
    console.error('❌ Pre-confirm xatolik:', err.response?.data || err.message)
    return null
  }
}

// ✅ 5. OTP orqali yakuniy to‘lov
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
  initCardBinding,
  confirmCardBinding,
  createTransaction,
  preConfirmTransaction,
  confirmPayment
}
