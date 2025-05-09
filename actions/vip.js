const { Markup } = require('telegraf')
const crypto = require('crypto')
const { createTransaction } = require('../helpers/atmosPayment')
const Deposit = require('../models/deposit')
const User = require('../models/user')

const prices = {
  720: 39000, // 1 oy
  2160: 99000, // 3 oy
  8760: 390000 // 12 oy
}

const FRONTEND_URL =
  process.env.NODE_ENV === 'development'
    ? 'https://7f45-213-206-60-189.ngrok-free.app'
    : 'https://atmos-integration.vercel.app'

module.exports = async (ctx) => {
  if (ctx.callbackQuery) await ctx.answerCbQuery()
  ctx.session = ctx.session || {}

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
      const card_token = user?.card_token

      if (!card_token) {
        const chatId = ctx.chat?.id
        if (!chatId || !transaction_id)
          return ctx.reply('❌ Token yoki chat ID aniqlanmadi')

        const url = `${FRONTEND_URL}/?chat_id=${chatId}&transaction_id=${transaction_id}`

        return ctx.reply(
          '❗️ Sizda karta tokeni mavjud emas.\n👇 Karta bog‘lash uchun tugmani bosing:',
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '💳 Karta bog‘lash',
                    web_app: {
                      url
                    }
                  }
                ]
              ]
            }
          }
        )
      }

      return ctx.editMessageText(
        ctx.i18n.t('vip.choose.text', { number: realAmount.format(1) }),
        Markup.inlineKeyboard(
          [
            Markup.callbackButton('✅ To‘lov muvaffaqiyatli', 'vip'),
            Markup.callbackButton(ctx.i18n.t('back'), 'vip')
          ],
          { columns: 1 }
        ).extra({
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          reply_to_message_id: ctx.message?.message_id,
          allow_sending_without_reply: true
        })
      )
    } catch (err) {
      console.error(
        '❌ Atmos tranzaksiya jarayonida xatolik:',
        err.response?.data || err.message
      )
      return ctx.reply(
        '❌ Tranzaksiya yaratishda xatolik yuz berdi. Keyinroq urinib ko‘ring.'
      )
    }
  }

  return ctx[ctx.message ? 'reply' : 'editMessageText'](
    ctx.i18n.t('vip.text'),
    Markup.inlineKeyboard([
      [
        Markup.callbackButton('🕐 1 oy – 39 000 so‘m', 'vip_720'),
        Markup.callbackButton('📅 3 oy – 99 000 so‘m', 'vip_2160')
      ],
      [Markup.callbackButton('📆 12 oy – 390 000 so‘m', 'vip_8760')],
      [Markup.callbackButton(ctx.i18n.t('back'), 'cabinet')]
    ]).extra({
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  )
}
