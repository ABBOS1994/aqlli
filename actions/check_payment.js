const axios = require('axios')
const { getAccessToken } = require('../helpers/atmos')
const Deposit = require('../models/deposit')

module.exports = async (ctx) => {
  try {
    const transactionId = ctx.state[0]
    const token = await getAccessToken()

    const response = await axios.get(
      `https://partner.atmos.uz/v1/transactions/${transactionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    if (response.data.status === 'success') {
      await Deposit.findOneAndUpdate(
        { transaction_id: transactionId },
        { status: 'completed' }
      )
      return ctx.reply('✅ To‘lov muvaffaqiyatli yakunlandi!')
    } else {
      return ctx.reply(
        '❌ To‘lov hali tasdiqlanmagan, biroz kuting yoki qayta urinib ko‘ring.'
      )
    }
  } catch (error) {
    console.error('❌ To‘lov tekshirishda xatolik:', error.message)
    return ctx.reply('❌ Xatolik yuz berdi, qayta urinib ko‘ring!')
  }
}
