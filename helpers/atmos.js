const axios = require('axios')
const qs = require('qs')
const config = require('../config')

async function getAccessToken() {
  try {
    const credentials = Buffer.from(
      `${config.ATMOS_CONSUMER_KEY}:${config.ATMOS_CONSUMER_SECRET}`
    ).toString('base64')

    const response = await axios.post(
      `${config.ATMOS_BASE_URL}/token`,
      qs.stringify({ grant_type: 'client_credentials' }),
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )

    return response.data.access_token
  } catch (error) {
    console.error(
      '❌ ATMOS Token olishda xatolik:',
      error.response?.data || error.message
    )
    throw new Error('ATMOS tokenini olishda xatolik yuz berdi!')
  }
}

async function createTransaction(amount, description, userId) {
  try {
    const token = await getAccessToken()

    const response = await axios.post(
      `${config.ATMOS_BASE_URL}/v1/transactions`,
      {
        amount: amount,
        currency: 'UZS',
        description: description,
        callback_url: config.CALLBACK_URL, // Hozir ishlamaydi
        return_url: config.RETURN_URL // Foydalanuvchini Telegram botga qaytarish
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return {
      paymentUrl: response.data.payment_url,
      transactionId: response.data.id
    }
  } catch (error) {
    console.error(
      '❌ ATMOS tranzaksiya yaratishda xatolik:',
      error.response?.data || error.message
    )
    throw new Error('ATMOS orqali tranzaksiya yaratishda xatolik!')
  }
}

module.exports = { getAccessToken, createTransaction }
