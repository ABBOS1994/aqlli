// helpers/atmosPayment.js
const axios = require('axios')
const { getToken } = require('./atmosTokenManager')

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
        lang: 'uz'
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    console.log('✅ Tranzaksiya yaratildi:', res.data)
    return res.data
  } catch (err) {
    console.error(
      '❌ Tranzaksiyani yaratishda xatolik:',
      err.response?.data || err.message
    )
    return null
  }
}

const preApplyPayment = async ({ transaction_id, card_token }) => {
  const token = await getToken()
  try {
    const res = await axios.post(
      `${BASE_URL}/merchant/pay/pre-apply`,
      {
        transaction_id,
        store_id: parseInt(process.env.ATMOS_STORE_ID),
        card_token,
        lang: 'uz'
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    console.log('📥 PreApplyResponse:', res.data)
    return res.data
  } catch (err) {
    console.error('❌ Pre-apply xatoligi:', err.response?.data || err.message)
    return null
  }
}

const confirmPayment = async ({ transaction_id, otp = 111111 }) => {
  const token = await getToken()
  try {
    const payload = {
      transaction_id,
      otp,
      store_id: parseInt(process.env.ATMOS_STORE_ID),
      lang: 'uz'
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }

    const res = await axios.post(
      `${BASE_URL}/merchant/pay/apply-ofd`,
      payload,
      { headers }
    )
    console.log('✅ To‘lov tasdiqlandi:', res.data)
    return res.data
  } catch (err) {
    console.error(
      '❌ To‘lovni tasdiqlashda xatolik:',
      err.response?.data || err.message
    )
    return null
  }
}

module.exports = {
  createTransaction,
  preApplyPayment,
  confirmPayment
}
