const { Markup } = require('telegraf')
const crypto = require('crypto')
const {
  createTransaction,
  preConfirmTransaction,
  confirmPayment: applyTransaction
} = require('../helpers/atmosPayment')
const Deposit = require('../models/deposit')
const User = require('../models/user')

const prices = {
  720: 39000, // 1 oy
  2160: 99000, // 3 oy
  8760: 390000 // 12 oy
}

const FRONTEND_URL =
  process.env.NODE_ENV === 'development'
    ? 'https://a7fd-213-206-60-189.ngrok-free.app'
    : 'https://atmos-integration.vercel.app'

module.exports = async (ctx) => {
  if (ctx.callbackQuery) await ctx.answerCbQuery()
  ctx.session = ctx.session || {}

  // ✅ Agar foydalanuvchi raqam tugmalarini bosayotgan bo‘lsa
  if (ctx.callbackQuery?.data?.startsWith('otp_')) {
    const key = ctx.callbackQuery.data.replace('otp_', '')
    ctx.session.payment = ctx.session.payment || { enteredOtp: '' }
    let code = ctx.session.payment.enteredOtp || ''

    if (key === '🗑') {
      code = ''
    } else if (key === '✅') {
      if (code.length === 6) {
        const { transaction_id, request_id, duration, realAmount } =
          ctx.session.payment
        try {
          const apply = await applyTransaction({ transaction_id, otp: code })
          if (!apply || apply.result?.code !== 'OK') {
            return ctx.editMessageText(
              '❌ Kod noto‘g‘ri yoki muddati tugagan. Yana urinib ko‘ring.'
            )
          }
          await Deposit.updateOne(
            { ext_id: request_id },
            { $set: { status: 'paid', appliedAt: new Date() } }
          )
          ctx.session.payment = null
          return ctx.editMessageText(
            `✅ To‘lov muvaffaqiyatli amalga oshirildi!\n💳 Muddati: ${
              duration / 720
            } oy, Summasi: ${realAmount.toLocaleString()} so‘m`
          )
        } catch (error) {
          console.error(
            '❌ Apply bosqichida xatolik:',
            error.response?.data || error.message
          )
          return ctx.editMessageText(
            '❌ Kodni tasdiqlashda xatolik yuz berdi. Iltimos, qaytadan urinib ko‘ring.'
          )
        }
      } else {
        return ctx.answerCbQuery('⛔️ Kod hali to‘liq emas')
      }
    } else if (/^\d$/.test(key) && code.length < 6) {
      code += key
    }

    ctx.session.payment.enteredOtp = code

    const keys = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['🗑', '0', '✅']
    ]

    const keyboard = {
      reply_markup: {
        inline_keyboard: keys.map((row) =>
          row.map((k) => ({ text: k, callback_data: `otp_${k}` }))
        )
      },
      parse_mode: 'Markdown'
    }

    return ctx.editMessageText(
      `📲 Telefoningizga SMS kod yuborildi.\n6 xonali kodni kiriting:\n\n*Kiritilgan:* \`${code}\``,
      keyboard
    )
  }

  if (ctx.state[0]) {
    const duration = ctx.state[0]
    const price = prices[duration]
    const random = crypto.randomInt(10000)
    const amount = price * 100 + random
    const realAmount = amount / 100
    const requestId = `${ctx.user.id}_${Date.now()}`

    try {
      await Deposit.create({
        status: 'pending',
        type: 'atmos',
        amount: realAmount,
        currency: 'UZS',
        per: duration,
        user: ctx.user.id,
        ext_id: requestId,
        createdAt: new Date()
      })

      const transactionData = await createTransaction(ctx.user.id, amount)
      const transaction_id = transactionData?.transaction_id
      const user = await User.findOne({ id: ctx.user.id })
      const card_token = user.card?.card_token

      if (!card_token) {
        const chatId = ctx.chat?.id || ctx.from?.id || ctx.message?.chat?.id
        const url = `${FRONTEND_URL}/?chat_id=${chatId}&transaction_id=${transaction_id}`
        return ctx.reply(
          '❗️ Sizda karta tokeni mavjud emas.\n👇 Karta bog‘lash uchun tugmani bosing:',
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '💳 Karta bog‘lash', web_app: { url } }]
              ]
            }
          }
        )
      }

      const preConfirm = await preConfirmTransaction(transaction_id, card_token)
      if (!preConfirm || preConfirm.result?.code !== 'OK') {
        throw new Error('Pre-confirm bosqichi muvaffaqiyatsiz')
      }

      ctx.session.payment = {
        transaction_id,
        request_id: requestId,
        duration,
        realAmount,
        enteredOtp: ''
      }

      const keys = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['🗑', '0', '✅']
      ]

      const keyboard = {
        reply_markup: {
          inline_keyboard: keys.map((row) =>
            row.map((k) => ({ text: k, callback_data: `otp_${k}` }))
          )
        },
        parse_mode: 'Markdown'
      }

      return ctx.reply(
        `📲 Telefoningizga SMS kod yuborildi.\n6 xonali kodni kiriting:\n\n*Kiritilgan:* \`\``,
        keyboard
      )
    } catch (err) {
      console.error(
        '❌ Atmos tranzaksiya jarayonida xatolik:',
        err.response?.data || err.message
      )
      return ctx.reply(
        '❌ Tranzaksiya yaratishda yoki to‘lovda xatolik yuz berdi. Keyinroq urinib ko‘ring.'
      )
    }
  }

  return ctx[ctx.message ? 'reply' : 'editMessageText'](
    ctx.i18n.t('vip.text'),
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🕐 1 oy – 39 000 so‘m', callback_data: 'vip_720' },
            { text: '📅 3 oy – 99 000 so‘m', callback_data: 'vip_2160' }
          ],
          [{ text: '📆 12 oy – 390 000 so‘m', callback_data: 'vip_8760' }],
          [{ text: ctx.i18n.t('back'), callback_data: 'cabinet' }]
        ]
      },
      parse_mode: 'HTML'
    }
  )
}
