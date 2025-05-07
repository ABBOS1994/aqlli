

// middlewares/sessionHandler.js ichiga quyidagilar qo‘shiladi
const { initCardBinding, confirmCardBinding } = require('../helpers/atmosPayment')

module.exports = () => async (ctx, next) => {
  ctx.session = ctx.session || {}

  if (ctx.message && ctx.message.text) {
    const text = ctx.message.text.trim()

    if (ctx.session.card_step === 'enter_card_number') {
      if (!/^[0-9]{16}$/.test(text)) {
        return ctx.reply('❌ Noto‘g‘ri karta raqami. 16 xonali raqam kiriting.')
      }
      ctx.session.card_bind.card_number = text
      ctx.session.card_step = 'enter_expiry'
      return ctx.reply('📅 Karta amal qilish muddatini kiriting (YYMM formatda, masalan: 2605):')
    }

    if (ctx.session.card_step === 'enter_expiry') {
      if (!/^[0-9]{4}$/.test(text)) {
        return ctx.reply('❌ Noto‘g‘ri format. Masalan: 2605 (2026 yil may)')
      }
      const card_number = ctx.session.card_bind.card_number
      const result = await initCardBinding({ card_number, expiry: text })

      if (result?.transaction_id) {
        ctx.session.card_step = 'confirm_otp'
        ctx.session.card_bind.transaction_id = result.transaction_id
        return ctx.reply('📩 SMS kod yuborildi. Iltimos, uni kiriting:')
      } else {
        ctx.session.card_step = null
        return ctx.reply('❌ Karta bog‘lashda xatolik. Keyinroq urinib ko‘ring.')
      }
    }

    if (ctx.session.card_step === 'confirm_otp') {
      const otp = text
      const transaction_id = ctx.session.card_bind.transaction_id
      const res = await confirmCardBinding({ transaction_id, otp, userId: ctx.user.id })

      if (res?.data?.card_token) {
        ctx.session.card_step = null
        return ctx.reply('✅ Karta muvaffaqiyatli bog‘landi.')
      } else {
        return ctx.reply('❌ Kod noto‘g‘ri yoki vaqt tugagan. Yana urinib ko‘ring.')
      }
    }
  }

  return next()
}
